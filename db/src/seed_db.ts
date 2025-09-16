import { Client } from "pg";

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "trades_db",
  password: "your_secure_password",
  port: 5432,
});

async function initialized() {
  await client.connect();

  // Enable TimescaleDB
  await client.query(`CREATE EXTENSION IF NOT EXISTS timescaledb`);

  console.log("⚠️ Dropping old tables...");
  await client.query(`DROP TABLE IF EXISTS trades CASCADE`);
  await client.query(`DROP TABLE IF EXISTS candles_1m CASCADE`);
  await client.query(`DROP TABLE IF EXISTS candles_5m CASCADE`);
  await client.query(`DROP TABLE IF EXISTS candles_10m CASCADE`);
  await client.query(`DROP TABLE IF EXISTS candles_1h CASCADE`);
  await client.query(`DROP TABLE IF EXISTS candles_2h CASCADE`);

  console.log("✅ Creating trades table...");
  await client.query(`
    CREATE TABLE trades (
      market TEXT NOT NULL,
      trade_time TIMESTAMPTZ NOT NULL,
      price NUMERIC(18, 8) NOT NULL,
      quantity NUMERIC(18, 8) NOT NULL,
      PRIMARY KEY (market, trade_time),
      CONSTRAINT trade_time_reasonable CHECK (
        trade_time > '2000-01-01'::timestamptz
        AND trade_time < '2100-01-01'::timestamptz
      )
    )
  `);

  await client.query(`
    SELECT create_hypertable(
      'trades',
      'trade_time',
      if_not_exists => true
    )
  `);

  // === Helper to create candle tables ===
  async function createCandleTable(name: string) {
    console.log(`✅ Creating ${name} table...`);
    await client.query(`
      CREATE TABLE ${name} (
        market TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        open NUMERIC(18, 8) NOT NULL,
        high NUMERIC(18, 8) NOT NULL,
        low NUMERIC(18, 8) NOT NULL,
        close NUMERIC(18, 8) NOT NULL,
        volume NUMERIC(18, 8) NOT NULL,
        PRIMARY KEY (market, start_time),
        CONSTRAINT ${name}_time_reasonable CHECK (
          start_time > '2000-01-01'::timestamptz
          AND start_time < '2100-01-01'::timestamptz
        )
      )
    `);

    await client.query(`
      SELECT create_hypertable(
        '${name}',
        'start_time',
        if_not_exists => true
      )
    `);
  }

  // Create all candle tables
  await createCandleTable("candles_1m");
  await createCandleTable("candles_5m");
  await createCandleTable("candles_10m");
  await createCandleTable("candles_1h");
  await createCandleTable("candles_2h");

  await client.end();
  console.log("🎉 All tables dropped & recreated successfully");
}

initialized().catch(console.error);
