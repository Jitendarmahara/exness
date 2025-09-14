import { Router } from "express";
import { Client } from "pg";
export const klinerouter:Router = Router()
const client = new Client({
    user:"postgres",
    host:"localhost",
    database:"trades_db",
    password:"your_secure_password",
    port:5432,
})
client.connect();
klinerouter.get("/candles_1m" ,async  (req , res)=>{
    try{
       console.log("connecte to pg databae");
    const market = req.query.market;
    if(!market){
        return 
    }
    const data = await client.query(`
        SELECT EXTRACT(EPOCH FROM start_time) AS time, open , high , low , close , volume FROM candles_1m
        WHERE market = $1
        ORDER BY start_time ASC
        LIMIT 100

    ` , [market]);

    const candles = data.rows.map(x =>({
        time: Math.floor(x.time),
        open: parseFloat(x.open),
        close: parseFloat(x.close),
        high: parseFloat(x.high),
        low: parseFloat(x.low)
    }))
    res.status(200).json(candles)
}
catch(e){
    res.status(404).json({msg:"error in backend"})
    console.log(e)
}
})
