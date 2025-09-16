import { WebSocketServer } from "ws";
import { WebsocketManager } from "./websocket";
const wss  = new WebSocketServer({port:8080});
WebsocketManager.getInstance(wss);
