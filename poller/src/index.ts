import { RedisClientType , createClient } from "redis";
import {Client} from "pg";

type candles= {
    open:number,
    low:number,
    close:number,
    high:number,
    volume:number,
    time:number
    
}
// what i am doing her is  {for the market BTC_USD , anothe record evry seind for that candle }
const livecandles: Record<string , Record<string , candles> > = {};
const intervals:Record<string , number> = {
    "1m":60_000,
    "5m":300_000,
    "10m":600_000,
    "1h":3600_000,
    "2h":7200_000
}

function updatelivecandle(market:string , price:number , quantity:number , trade_time:number){
    for(const [interval , ms] of Object.entries(intervals)){
        const starttime = trade_time - (trade_time%ms);
        if(!livecandles[market]){
            livecandles[market] = {}

        }
        const candle = livecandles[market][interval];
        if(!candle || candle.time!==starttime){
            livecandles[market][interval] = {
                open:price,
                low:price,
                high:price,
                close:price,
                volume:price,
                time:starttime
            }
        }else{
            candle.high = Math.max(candle.high , price);
            candle.low = Math.min(candle.low , price);
            candle.volume += quantity;
            candle.close = price;
        }
    }
}
async function Poller(){
    const client:RedisClientType = createClient();
    await client.connect();

    const publish = createClient();
    await publish.connect();
    console.log("connected to the redis client")

    const pgclinet = new Client({
        user:"postgres",
        host:"localhost",
        database:"trades_db",
        password:"your_secure_password",
        port: 5432
    })
    await pgclinet.connect();

    setInterval(async()=>{
        for(const[market , byinterval] of Object.entries(livecandles)){
            for(const [interval ,candle] of Object.entries(byinterval)){
                await publish.publish(`candles:${market}:${interval}` , JSON.stringify({...candle , partial:true}))
            }
        }
    } , 1000)
    while(true){
        try{

            const res = await client.brPop("@KlineData" , 0);
            if(!res){
                continue;
            }
            const message = JSON.parse(res.element);
            // this will push each and every trade to the db fo trades; 
            const trade = message.data
            if(trade.e === "bookTicker"){
                const ask:string = trade.a;
                const bid:string  = trade.b;
                const market:string = trade.s;
                const message = {
                    ask,
                    bid,
                    market
                }
                await publish.publish("WsbidaskUpdates" , JSON.stringify(message))
            }
            if(trade.e === "trade"){
               const market = trade.s;
               const trade_time = new Date(trade.T /1000) ;
               const price = parseFloat(trade.p);
               const quantity = parseFloat(trade.q);
               await client.publish("WspriceUpdates" , JSON.stringify({market , price})); // we need to push this price form the websocket to update the current price 
              await pgclinet.query(
                `INSERT INTO trades(market , trade_time , price , quantity )VALUES($1 , $2 , $3 , $4)`,[market , trade_time , price , quantity]
            );
            console.log("data in send in the table")
            // calculate the in memroy ohcl evry soedn and then publish to  the pub/sub from ther the websocket will pick and send to the frontend
            updatelivecandle(market , price , quantity , trade.T);
            console.log("update sucessfully");
            } 
            
        }catch(e){
            console.log(e);
        }

    }
    
    
}
Poller();
