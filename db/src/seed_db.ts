import {Client } from "pg";

const client = new Client({
    user: "postgres",
    host:"localhost",
    database:"trades_db",
    password:"your_secure_password",
    port:5432
})

async function initialized(){
    await client.connect();

     await client.query(`CREATE EXTENSION IF NOT EXISTS timescaledb`);
    await client.query(`
        CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        market TEXT NOT NULL ,
        trade_time TIMESTAMPTZ NOT NULL,
        price NUMERIC(18 , 8) NOT NULL,
        quantity NUMERIC(18 , 8)NOT NULL
        )
    `)

    await client.query(`
        CREATE TABLE IF NOT EXISTS candles_1m (
        market TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        open NUMERIC(18 , 8)NOT NULL,
        high NUMERIC(18 , 8)NOT NULL,
        low NUMERIC(18 , 8)NOT NULL,
        close NUMERIC(18 , 8)NOT NULL,
        volume NUMERIC(18 , 8)NOT NULL,
        PRIMARY KEY(market , start_time)
        )
    `)
    await client.query(`SELECT create_hypertable('candles_1m', 'start_time' , if_not_exists => true)`)

    await client.query(
        `
        CREATE TABLE IF NOT EXISTS candles_5m (
        market TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        open NUMERIC(18 , 8)NOT NULL,
        high NUMERIC(18 , 8)NOT NULL,
        low NUMERIC(18 , 8)NOT NULL,
        close NUMERIC(18 , 8)NOT NULL,
        volume NUMERIC(18 , 8)NOT NULL,
        PRIMARY KEY(market , start_time)
        )
    `)
    await client.query(`SELECT create_hypertable('candles_5m', 'start_time' , if_not_exists => true)`)
    await client.query(`
        CREATE TABLE IF NOT EXISTS candles_10m (
        market TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        open NUMERIC(18 , 8)NOT NULL,
        high NUMERIC(18 , 8)NOT NULL,
        low NUMERIC(18 , 8)NOT NULL,
        close NUMERIC(18 , 8)NOT NULL,
        volume NUMERIC(18 , 8)NOT NULL,
        PRIMARY KEY(market , start_time)
        )
    `)
     await client.query(`SELECT create_hypertable('candles_10m', 'start_time' , if_not_exists => true)`)
    await client.query(`
        CREATE TABLE IF NOT EXISTS candles_1h (
        market TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        open NUMERIC(18 , 8)NOT NULL,
        high NUMERIC(18 , 8)NOT NULL,
        low NUMERIC(18 , 8)NOT NULL,
        close NUMERIC(18 , 8)NOT NULL,
        volume NUMERIC(18 , 8)NOT NULL,
        PRIMARY KEY(market , start_time)
        )
    `)
    await client.query(`SELECT create_hypertable('candles_1h', 'start_time' , if_not_exists => true)`)
    await client.query(`
        CREATE TABLE IF NOT EXISTS candles_2h (
        market TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        open NUMERIC(18 , 8)NOT NULL,
        high NUMERIC(18 , 8)NOT NULL,
        low NUMERIC(18 , 8)NOT NULL,
        close NUMERIC(18 , 8)NOT NULL,
        volume NUMERIC(18 , 8)NOT NULL,
        PRIMARY KEY(market , start_time)
        )
    `)
     await client.query(`SELECT create_hypertable('candles_2h', 'start_time' , if_not_exists => true)`)

     await client.end();
    console.log("table created successfully")
}

initialized().catch(console.error)