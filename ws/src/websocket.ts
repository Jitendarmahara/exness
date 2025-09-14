// du to sleppy the frontend bufferary i have done int he backend 
import { RedisClientType , createClient } from "redis";
import {WebSocket , WebSocketServer}  from  "ws"
type Incommingmessage  =  {

    type :string,
    market:string,
    time_frame:string
}
type candle = {
    open:number,
    close:number,
    low:number,
    high:number,
    starttime:number,
    volume:number
}
type clientInfo={
    socket: WebSocket;
    market?:string | undefined;
    time_frame?:string | undefined;
    bufferedmessages:any[] ;
}
export class websocketManager{
    private static instance:websocketManager
    private client!:RedisClientType
    private clients:Set<clientInfo> = new Set();
    constructor(private wss:WebSocketServer){
        this.wss.on("connection" , (ws) => this.handleonconnection(ws));
        this.subscribetoredis();
    }

    public static getInstance(wss:WebSocketServer){
        if(!this.instance){
            this.instance = new websocketManager(wss);
        }
        return this.instance
    }


    private handleonconnection(ws:WebSocket){
        const client:clientInfo = {socket:ws , bufferedmessages:[]};
        this.clients.add(client);
        ws.on("open" , ()=>{
            client.bufferedmessages.forEach((msg)=>ws.send(msg))
            client.bufferedmessages = [];
        })
        ws.on("message" , (message)=>{
            console.log(message);
            const parsedmessage: Incommingmessage =  JSON.parse(message.toString());
            this.handlemessage(client , parsedmessage)
            console.log("i was done")
        })
        ws.on("close" , ()=>this.clients.delete(client))
    }

    private handlemessage(client:clientInfo , msg:Incommingmessage ){
        try{
            const data = msg;
            if(data.type === "SUBSCRIBE"){
                client.market = data.market;
                client.time_frame = data.time_frame
                console.log("Client subscribed:", data.market, data.time_frame);
            }else if(data.type === "UNSUBSCRIBE"){
                client.market= undefined;
                client.time_frame = undefined;
            }
        }catch(e){
            console.log(e)
        }
    }

    private sendorbuffer(client:clientInfo , data:any){
        const msg = JSON.stringify(data);
        if(client.socket.readyState === WebSocket.OPEN){
            client.socket.send(msg);
        }
        else{
            client.bufferedmessages.push(msg);
        }
    }

    private async subscribetoredis(){
        this.client = createClient();
        await this.client.connect();
        await this.client.pSubscribe("candles:*", (message, channel) => {
            const [, market, time_frame] = channel.split(":");
            if (!market || !time_frame) return;
            const candle = JSON.parse(message);
            // Only send to clients that subscribed to this market + timeframe
            this.clients.forEach((c) => {
                 if (
                    c.socket.readyState === WebSocket.OPEN &&c.market === market &&c.time_frame === time_frame) {
                        console.log("i a getting called so many tiems"+market);
                        this.sendorbuffer(c, {
                            type: "candle",
                             candle,
                              market,
                              time_frame,
      });
    }
  });
})

        await this.client.pSubscribe("WsbidaskUpdates" , (message)=>{
            const parsedmessage = JSON.parse(message); // here we will gethe best bid and aks for that market;
            this.broadcastbdiandask(parsedmessage.market , parsedmessage.bid , parsedmessage.ask);

        })
        await this.client.pSubscribe("WspriceUpdates" , (message)=>{
            const parsedmessage = JSON.parse(message);
            this.broadcastupdatedprice(parsedmessage.market , parsedmessage.price);
        })
    }


    private broadcastbdiandask(market:string , bid:number , ask:number){
        this.clients.forEach(x => {
             this.sendorbuffer( x,{type:"bidask" , bid , ask , market})
        })
    }
   private broadcastcandles(market: string, time_frame: string, candle: candle) {
    this.clients.forEach(clients => {
        if (clients.market === market && clients.time_frame === time_frame) {
            // ✅ convert ms → seconds here
            const normalizedCandle = {
                ...candle,
                startime: Math.floor(candle.starttime / 1000),
            };
            this.sendorbuffer(clients , { type: "candle", candle: normalizedCandle, market });
        }
    });
}

    private broadcastupdatedprice(market:string , price:number){
        this.clients.forEach(clients=>{
            if(clients.market === market){
                this.sendorbuffer(clients , {type:"price" ,price , market})
            }
        })
    }
    
}