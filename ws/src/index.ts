import { WebSocketServer } from "ws";
import { websocketManager } from "./websocket";
const wss  = new WebSocketServer({port:8080});
websocketManager.getInstance(wss);
