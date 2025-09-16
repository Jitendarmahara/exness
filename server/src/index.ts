import { RedisClientType, createClient } from "redis";
import WebSocket from "ws";

let globalid = 1;
const symbols = ["BTC_USDC", "SOL_USDC", "ETH_USDC"];

async function start() {
  const client: RedisClientType = createClient();
  await client.connect();
  console.log("Connected to Redis");

  const wss = new WebSocket("wss://ws.backpack.exchange/");

  let Solanaprice = 0;
  let Btcprice = 0;
  let Ethprice = 0;

  wss.on("open", () => {
    console.log("Connected to Backpack Exchange");
    for (const x of symbols) {
      wss.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: [`trade.${x}`, `bookTicker.${x}`],
          id: globalid++,
        })
      );
    }
  });

  wss.on("message", async (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (!parsed) return;

      // push raw message into Redis for poller
      await client.lPush("@KlineData", JSON.stringify(parsed));

      const { stream, data } = parsed;

      if (data?.e === "trade") {
        if (stream === "trade.SOL_USDC") {
          Solanaprice = parseFloat(data.p);
        } else if (stream === "trade.BTC_USDC") {
          Btcprice = parseFloat(data.p);
        } else if (stream === "trade.ETH_USDC") {
          Ethprice = parseFloat(data.p);
        }

        console.log(
          `Prices → SOL: ${Solanaprice} | BTC: ${Btcprice} | ETH: ${Ethprice}`
        );
      }
    } catch (e) {
      console.error("Error parsing message:", e);
    }
  });

  wss.on("close", () => {
    console.error("Disconnected from Backpack, retrying...");
    setTimeout(start, 5000); // auto-reconnect after 5s
  });

  wss.on("error", (err) => {
    console.error("WebSocket error:", err);
    wss.close();
  });
}

start().catch(console.error);
