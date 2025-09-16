import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import { WebSocketManager, Wsmessage } from "../wbsokcet"; // adjust path

interface SimpleChartProps {
  symbol: string;
}

// Round timestamp to interval
function roundToInterval(timestamp: number, intervalSec: number) {
  return timestamp - (timestamp % intervalSec);
}

export function SimpleChart({ symbol }: SimpleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState("1m");
  const [currentPrice, setCurrentPrice] = useState(0);

  const intervalMap: Record<string, number> = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400,
  };

  // ✅ Handle WebSocket messages
  const handleWebSocketMessage = (msg: Wsmessage) => {
    if (!candlestickSeriesRef.current) return;

    if (msg.type === "candle" && msg.market === symbol) {
      const intervalSec = intervalMap[timeframe] || 60;

      // normalize timestamp
      let ts = msg.time;
      if (ts > 1e15) ts = Math.floor(ts / 1_000_000);
      else if (ts > 1e10) ts = Math.floor(ts / 1000);

      const roundedTime = roundToInterval(ts, intervalSec);

      const formattedCandle = {
        time: roundedTime,
        open: msg.open,
        high: msg.high,
        low: msg.low,
        close: msg.close,
      };

      console.log(" [WS Candle]", formattedCandle, "partial:", msg.partial);

      candlestickSeriesRef.current.update(formattedCandle);
      setCurrentPrice(formattedCandle.close);
    }

    if (msg.type === "price" && msg.market === symbol) {
      setCurrentPrice(msg.price);
      console.log("💰 [WS Price]", msg.price);
    }
  };

  // Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "hsl(222, 84%, 5%)" },
        textColor: "hsl(210, 40%, 98%)",
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      grid: {
        vertLines: { color: "hsl(218, 25%, 18%)" },
        horzLines: { color: "hsl(218, 25%, 18%)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "hsl(218, 25%, 18%)" },
      timeScale: { borderColor: "hsl(218, 25%, 18%)", timeVisible: true },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Timeframe & WebSocket subscription
  useEffect(() => {
    const ws = WebSocketManager.getInstance("ws://localhost:8080");
    ws.addListener(handleWebSocketMessage);
    ws.connect();

    // Subscribe
    ws.subscribe(symbol, timeframe);

    // Fetch historical candles
    (async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/v1/kline/candles_${timeframe}?market=${symbol}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const data = await res.json();

        if (candlestickSeriesRef.current && data.length > 0) {
          const processedData = data.map((candle: any) => ({
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          }));

          candlestickSeriesRef.current.setData(processedData);
          setCurrentPrice(processedData[processedData.length - 1].close);

          console.log(" [History Loaded]", processedData.length, "candles");
        }
      } catch (err) {
        console.error("Error in fetchAndSubscribe:", err);
      }
    })();

    // Cleanup
    return () => {
      ws.unsubscribe(symbol, timeframe);
      ws.removeListener(handleWebSocketMessage);
    };
  }, [symbol, timeframe]);

  const timeframes = [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "15m", value: "15m" },
    { label: "1h", value: "1h" },
    { label: "4h", value: "4h" },
    { label: "1d", value: "1d" },
  ];

  return (
    <Card className="trading-card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-foreground">{symbol}</h2>
          <Badge variant="outline" className="text-xs">Live Chart</Badge>
          <div className="text-lg font-mono font-bold text-buy">
            {currentPrice.toFixed(4)}
          </div>
        </div>
        <div className="flex space-x-1">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant={timeframe === tf.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe(tf.value)}
              className="text-xs px-2 py-1 h-7"
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="chart-container w-full relative">
        <div ref={chartContainerRef} className="w-full h-full" style={{ height: "500px" }} />
      </div>
    </Card>
  );
}
