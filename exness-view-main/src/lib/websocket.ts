export type CandleMessage = {
    starttime: number;
    start: number;
    close: number;
    low: number;
    high: number;
    open: number;
};

export type Wsmessage =
  | { type: "candle"; candle: CandleMessage }
  | { type: "price"; price: number }
  | { type: "bidask"; bid: number; ask: number };

export class WebSocketManager {
    private static instance: WebSocketManager;
    private url: string;
    private onmessage: (msg: Wsmessage) => void;
    private ws: WebSocket | null = null;
    private bufferedMessages: any[] = [];

    private constructor(url: string, onmessage: (msg: Wsmessage) => void) {
        this.url = url;
        this.onmessage = onmessage;
    }

    public static getInstance(url?: string, onmessage?: (msg: Wsmessage) => void): WebSocketManager {
        if (!this.instance) {
            if (!url || !onmessage) {
                throw new Error("function parameters are missing");
            }
            this.instance = new WebSocketManager(url, onmessage);
        }
        return this.instance;
    }

    connect() {
        if (this.ws) return;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("connected to websocket");
            this.bufferedMessages.forEach(msg => this.ws?.send(JSON.stringify(msg)));
            this.bufferedMessages = [];
        };

        this.ws.onmessage = (event) => {
            try {
                const message: Wsmessage = JSON.parse(event.data);
                this.onmessage(message);
            } catch (e) {
                console.log(e);
            }
        };

        this.ws.onclose = () => {
            console.log("disconnected");
        };
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

    close() {
        this.ws?.close();
        this.ws = null;
    }
}