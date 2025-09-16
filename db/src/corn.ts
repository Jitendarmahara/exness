import { Client } from "pg";
import cron from "node-cron";

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "trades_db",
  password: "your_secure_password",
  port: 5432,
});

async function aggregateCandles({
  bucketMinutes,
  table,
}: {
  bucketMinutes: number;
  table: string;
}) {
  try {
    await client.query(`
      INSERT INTO ${table} (market, start_time, open, high, low, close, volume)
      SELECT
        market,
        to_timestamp(FLOOR(EXTRACT(EPOCH FROM trade_time) / (${bucketMinutes}*60)) * (${bucketMinutes}*60)) AS start_time,
        (ARRAY_AGG(price ORDER BY trade_time ASC))[1]  AS open,
        MAX(price)                                    AS high,
        MIN(price)                                    AS low,
        (ARRAY_AGG(price ORDER BY trade_time DESC))[1] AS close,
        SUM(quantity)                                 AS volume
      FROM trades
      WHERE trade_time >= NOW() - interval '${bucketMinutes * 2} minutes'
      GROUP BY market, start_time
      ON CONFLICT (market, start_time) DO UPDATE
      SET
        open   = EXCLUDED.open,
        high   = EXCLUDED.high,
        low    = EXCLUDED.low,
        close  = EXCLUDED.close,
        volume = EXCLUDED.volume;
    `);

    console.log(`${bucketMinutes}-minute candles aggregated successfully`);
  } catch (e) {
    console.error("Error aggregating candles:", e);
  }
}

async function start() {
  await client.connect();
  console.log("Connected to trades_db");

  // Schedule intraday candles
  cron.schedule("*/1 * * * *", async () => {
    await aggregateCandles({ bucketMinutes: 1, table: "candles_1m" });
  });

  cron.schedule("*/5 * * * *", async () => {
    await aggregateCandles({ bucketMinutes: 5, table: "candles_5m" });
  });

  cron.schedule("*/10 * * * *", async () => {
    await aggregateCandles({ bucketMinutes: 10, table: "candles_10m" });
  });

  cron.schedule("0 * * * *", async () => {
    await aggregateCandles({ bucketMinutes: 60, table: "candles_1h" });
  });

  cron.schedule("0 */2 * * *", async () => {
    await aggregateCandles({ bucketMinutes: 120, table: "candles_2h" });
  });
}

start().catch(console.error);
