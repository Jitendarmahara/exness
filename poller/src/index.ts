import { RedisClientType, createClient } from "redis";
import { Client } from "pg";

type Candle = {
  open: number;
  low: number;
  close: number;
  high: number;
  volume: number;
  time: number; // seconds
  partial: boolean;
};

// In-memory live candles: market -> interval -> Candle
const liveCandles: Record<string, Record<string, Candle>> = {};

const intervals: Record<string, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "10m": 600_000,
  "1h": 3_600_000,
  "2h": 7_200_000,
};

// ✅ Normalize exchange timestamp into ms
function normalizeTimestamp(T: number): number {
  if (T > 1e15) {
    // microseconds → ms
    return Math.floor(T / 1000);
  } else if (T > 1e12) {
    // already ms
    return T;
  } else {
    // seconds → ms
    return T * 1000;
  }
}

// Function to update or create a live candle
function updateLiveCandle(
  market: string,
  price: number,
  quantity: number,
  tradeTime: number,
  publish: RedisClientType
) {
  if (!liveCandles[market]) {
    liveCandles[market] = {};
  }

  const tradeTimestampInMs = normalizeTimestamp(tradeTime);

  for (const [interval, ms] of Object.entries(intervals)) {
    // Calculate the start time of the current candle interval
    const intervalStartTime = Math.floor(tradeTimestampInMs / ms) * ms;

    let candle = liveCandles[market][interval];

    // New interval
    if (!candle || candle.time * 1000 !== intervalStartTime) {
      // Finalize old candle
      if (candle) {
        candle.partial = false;
        publish.publish(
          `candles:${market}:${interval}`,
          JSON.stringify({
            type: "candle",
            market,
            candle: { ...candle, time: candle.time },
          })
        );
      }

      // Start new candle
      const newCandle: Candle = {
        open: price,
        high: price,
        low: price,
        close: price,
        volume: quantity,
        time: Math.floor(intervalStartTime / 1000), // seconds
        partial: true,
      };

      liveCandles[market][interval] = newCandle;
      candle = newCandle;
    } else {
      // Update existing candle
      candle.high = Math.max(candle.high, price);
      candle.low = Math.min(candle.low, price);
      candle.close = price;
      candle.volume += quantity;
    }

    // Always publish partial candle
    publish.publish(
      `candles:${market}:${interval}`,
      JSON.stringify({
        type: "candle",
        market,
        candle: { ...candle, time: candle.time },
      })
    );
  }
}

// Poller function
async function Poller() {
  const client: RedisClientType<any> = createClient();
  await client.connect();

  const publish: RedisClientType<any> = createClient();
  await publish.connect();
  console.log("Connected to Redis");

  const pgClient = new Client({
    user: "postgres",
    host: "localhost",
    database: "trades_db",
    password: "your_secure_password",
    port: 5432,
  });
  await pgClient.connect();
  console.log("Connected to PostgreSQL");

  // Periodically re-publish current candles
  setInterval(async () => {
    for (const [market, intervalCandles] of Object.entries(liveCandles)) {
      for (const [interval, candle] of Object.entries(intervalCandles)) {
        await publish.publish(
          `candles:${market}:${interval}`,
          JSON.stringify({
            type: "candle",
            market,
            candle: { ...candle, time: candle.time },
          })
        );
      }
    }
  }, 1000);

  while (true) {
    try {
      const res = await client.brPop("@KlineData", 0);
      if (!res) continue;

      const message = JSON.parse(res.element);
      const trade = message.data;

      // Bid/Ask updates
      if (trade.e === "bookTicker") {
        const ask: string = trade.a;
        const bid: string = trade.b;
        const market: string = trade.s;
        await publish.publish(
          "WsbidaskUpdates",
          JSON.stringify({ type: "bidask", market, bid, ask })
        );
      }

      // Trade updates
      if (trade.e === "trade") {
        const market = trade.s;
        const tradeTimeMs = normalizeTimestamp(trade.T); // ✅ FIXED
        const price = parseFloat(trade.p);
        const quantity = parseFloat(trade.q);

        // Publish price update
        await publish.publish(
          "WspriceUpdates",
          JSON.stringify({ type: "price", market, price })
        );

        // Insert trade into PostgreSQL
        await pgClient.query(
          `INSERT INTO trades(market, trade_time, price, quantity) VALUES($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [market, new Date(tradeTimeMs), price, quantity]
        );

        // Update candles
        updateLiveCandle(market, price, quantity, tradeTimeMs, publish as any);
      }
    } catch (e) {
      console.error("Poller error:", e);
    }
  }
}

Poller();
