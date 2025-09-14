import { Client } from "pg";
import cron from "node-cron";

const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "trades_db",
    password: "your_secure_password",
    port: 5432
});

async function aggregateCandles({bucketMinutes, table}:{bucketMinutes:number, table:string}) {
    try {
        await client.query(`
            INSERT INTO ${table} (market, start_time, open, high, low, close, volume)
            SELECT
                market,
                -- calculate bucket start time
                date_trunc('minute', trade_time) + 
                    FLOOR(EXTRACT(MINUTE FROM trade_time)::int / ${bucketMinutes}) * interval '${bucketMinutes} minutes' AS start_time,
                (ARRAY_AGG(price ORDER BY trade_time))[1] AS open,
                MAX(price) AS high,
                MIN(price) AS low,
                (ARRAY_AGG(price ORDER BY trade_time DESC))[1] AS close,
                SUM(quantity) AS volume
            FROM trades
            WHERE trade_time >= NOW() - INTERVAL '${bucketMinutes} minute'
              AND trade_time < NOW()
            GROUP BY market, start_time
            ON CONFLICT (market, start_time) DO UPDATE
            SET
                open = EXCLUDED.open,
                high = GREATEST(${table}.high, EXCLUDED.high),
                low = LEAST(${table}.low, EXCLUDED.low),
                close = EXCLUDED.close,
                volume = ${table}.volume + EXCLUDED.volume
        `);

        console.log(`${bucketMinutes}-minute candles aggregated successfully`);
    } catch (e) {
        console.log(e);
    }
}

async function start() {
    await client.connect();
    console.log("connected to trades_db");

    cron.schedule("*/1 * * * *", async () => {
        console.log("running 1-minute");
        await aggregateCandles({bucketMinutes: 1, table:"candles_1m"});
    });

    cron.schedule("*/5 * * * *", async () => {
        console.log("running 5-minute");
        await aggregateCandles({bucketMinutes: 5, table:"candles_5m"});
    });

    cron.schedule("*/10 * * * *", async () => {
        console.log("running 10-minute");
        await aggregateCandles({bucketMinutes: 10, table:"candles_10m"});
    });

    cron.schedule("0 * * * *", async () => {
        console.log("running 1-hour");
        await aggregateCandles({bucketMinutes: 60, table:"candles_1h"});
    });

    cron.schedule("0 */2 * * *", async () => {
        console.log("running 2-hour");
        await aggregateCandles({bucketMinutes: 120, table:"candles_2h"});
    });
}

start().catch(console.error);
