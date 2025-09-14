import express from "express";
import cors from "cors"
import { klinerouter } from "./routes/routes";
const app  = express();
app.use(express.json());
app.use(cors())

app.use('/api/v1/kline' , klinerouter);

app.listen(3000 , ()=>{
    console.log("server is listning at port 3000")
})