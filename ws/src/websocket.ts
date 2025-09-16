import { RedisClientType, createClient } from "redis";
import { WebSocket, WebSocketServer } from "ws";

type IncomingMessage = {
  type: string;
  market: string;
  time_frame: string;
};

type Candle = {
  open: number;
  close: number;
  low: number;
  high: number;
  volume: number;
  time: number;   // epoch seconds
  partial?: boolean;
};

type ClientInfo = {
  socket: WebSocket;
  market?: string | undefined;
  time_frame?: string | undefined;
  bufferedmessages: string[];
};

export class WebsocketManager {
  private static instance: WebsocketManager;
  private client!: RedisClientType;
  private clients: Set<ClientInfo> = new Set();

  constructor(private wss: WebSocketServer) {
    this.wss.on("connection", (ws) => this.handleConnection(ws));
    this.subscribeToRedis();
  }

  public static getInstance(wss: WebSocketServer) {
    if (!this.instance) {
      this.instance = new WebsocketManager(wss);
    }
    return this.instance;
  }

  private handleConnection(ws: WebSocket) {
    const client: ClientInfo = { socket: ws, bufferedmessages: [] };
    this.clients.add(client);

    ws.on("message", (raw) => {
      try {
        const parsed: IncomingMessage = JSON.parse(raw.toString());
        this.handleMessage(client, parsed);
      } catch (e) {
        console.error("Invalid client message:", e);
      }
    });

    ws.on("close", () => this.clients.delete(client));
  }

  private handleMessage(client: ClientInfo, msg: IncomingMessage) {
    if (msg.type === "SUBSCRIBE") {
      client.market = msg.market;
      client.time_frame = msg.time_frame;
      console.log("✅ Client subscribed:", msg.market, msg.time_frame);
    } else if (msg.type === "UNSUBSCRIBE") {
      client.market = undefined;
      client.time_frame = undefined;
      console.log("❌ Client unsubscribed");
    }
  }

  private sendOrBuffer(client: ClientInfo, data: any) {
    const msg = JSON.stringify(data);
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(msg);
    } else {
      client.bufferedmessages.push(msg);
    }
  }

  private async subscribeToRedis() {
    this.client = createClient();
    await this.client.connect();

    // ✅ Candle updates
    await this.client.pSubscribe("candles:*", (message, channel) => {
      const [, market, time_frame] = channel.split(":");
      if (!market || !time_frame) return;

      const parsed = JSON.parse(message); // from Poller
      const candle: Candle = parsed.candle;

      if (!candle || !candle.time) {
        console.warn("❌ Candle missing:", parsed);
        return;
      }

      const normalized = {
        type: "candle",
        market,
        time_frame,
        ...candle, // forward {time, open, high, low, close, volume, partial}
      };

      this.clients.forEach((c) => {
        if (
          c.socket.readyState === WebSocket.OPEN &&
          c.market === market &&
          c.time_frame === time_frame
        ) {
          this.sendOrBuffer(c, normalized);
        }
      });
    });

    // ✅ Bid/Ask updates
    await this.client.pSubscribe("WsbidaskUpdates", (message) => {
      const parsed = JSON.parse(message);
      this.broadcastBidAsk(parsed.market, parsed.bid, parsed.ask);
    });

    // ✅ Price updates
    await this.client.pSubscribe("WspriceUpdates", (message) => {
      const parsed = JSON.parse(message);
      this.broadcastPrice(parsed.market, parsed.price);
    });
  }

  private broadcastBidAsk(market: string, bid: number, ask: number) {
    this.clients.forEach((c) => {
      this.sendOrBuffer(c, { type: "bidask", bid, ask, market });
    });
  }

  private broadcastPrice(market: string, price: number) {
    this.clients.forEach((c) => {
      if (c.market === market) {
        this.sendOrBuffer(c, { type: "price", price, market });
      }
    });
  }
}
