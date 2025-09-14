// this code is basically working as a client to connect to the websocket of the backpackexchange..
import { RedisClientType , createClient } from "redis";
import webSocket from "ws"
let globalid = 1;
const client = createClient();
client.connect();
const wss = new webSocket("wss://ws.backpack.exchange/");
const symbols = ["BTC_USDC" , "SOL_USDC" , "ETH_USDC"]
let  Solanaprice = 0;
let Btcprice = 0;
let Ethprice = 0;
wss.on("open" , ()=>{
    for(const x of symbols){
         wss.send(JSON.stringify({
            "method":"SUBSCRIBE",
            "params":[`trade.${x}` , `bookTicker.${x}`],
            "id":globalid++
         }))
    }
})
wss.on("message" , (msg)=>{
    try{
        const message = msg.toString();
        const parsedmessage = JSON.parse(message);
        if(!parsedmessage){
            return
        }
        client.lPush("@KlineData" , JSON.stringify(parsedmessage))
        const{stream , data} = parsedmessage;
        if(data.e === "trade"){
             if(stream === "trade.SOL_USDC"){
                Solanaprice = data.p 
            }
        else if(stream === "trade.BTC_USDC"){
            Btcprice =data.p 
        }else{
            Ethprice = data.p
        }

        console.log("Ethprice"+Ethprice);
        console.log("Solanaprice"+Solanaprice);
        console.log("Btcprice"+Btcprice);
        }
    }
    catch(e){
        console.log(e);
    } 
})