// Shared candle shape
export type CandleMessage = {
  time: number;      // epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  partial: boolean;
};

// A candle update over WS
export type CandleWsMessage = {
  type: "candle";
  market: string;
  time_frame: string;
} & CandleMessage;

// A price update
export type PriceWsMessage = {
  type: "price";
  market: string;
  price: number;
};

// A bid/ask update
export type BidAskWsMessage = {
  type: "bidask";
  market: string;
  bid: number;
  ask: number;
};

// ✅ Union type for all messages
export type Wsmessage = CandleWsMessage | PriceWsMessage | BidAskWsMessage;

// WebSocketManager.ts
export class WebSocketManager {
  private static instance: WebSocketManager;
  private url: string;
  private ws: WebSocket | null = null;
  private listeners: ((msg: Wsmessage) => void)[] = [];
  private bufferedMessages: any[] = [];

  private constructor(url: string) {
    this.url = url;
  }

  public static getInstance(url?: string): WebSocketManager {
    if (!this.instance) {
      if (!url) throw new Error("URL required for first initialization");
      this.instance = new WebSocketManager(url);
    }
    return this.instance;
  }

  connect() {
    if (this.ws) return;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("✅ Connected to websocket");
      this.bufferedMessages.forEach(msg => this.ws?.send(JSON.stringify(msg)));
      this.bufferedMessages = [];
    };

    this.ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        if (raw.type === "candle" || raw.type === "price" || raw.type === "bidask") {
          this.listeners.forEach(fn => fn(raw as Wsmessage));
        } else {
          console.warn("⚠️ Unknown WS message:", raw);
        }
      } catch (e) {
        console.error("❌ WS parse error:", e);
      }
    };

    this.ws.onclose = () => {
      console.log("❌ Disconnected from websocket");
      this.ws = null;
    };
  }

  addListener(fn: (msg: Wsmessage) => void) {
    this.listeners.push(fn);
  }

  removeListener(fn: (msg: Wsmessage) => void) {
    this.listeners = this.listeners.filter(l => l !== fn);
  }

  sendMessage(msg: any) {
    const payload = JSON.stringify(msg);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.bufferedMessages.push(msg);
    }
  }

  subscribe(market: string, interval: string) {
    this.sendMessage({ type: "SUBSCRIBE", market, time_frame: interval });
  }

  unsubscribe(market: string, interval: string) {
    this.sendMessage({ type: "UNSUBSCRIBE", market, time_frame: interval });
  }

  close() {
    this.ws?.close();
    this.ws = null;
  }
}
