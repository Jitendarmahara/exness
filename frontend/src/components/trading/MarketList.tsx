import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { WebSocketManager, Wsmessage } from "../wbsokcet";

interface MarketData {
  symbol: string;
  name: string;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  volume: number;
}

const mockMarkets: MarketData[] = [
  { symbol: "SOL_USDC", name: "Euro / US Dollar", bid: 0, ask: 0, change: 0, changePercent: 0, volume: 0 },
  { symbol: "ETH_USDC", name: "British Pound / US Dollar", bid: 0, ask: 0, change: 0, changePercent: 0, volume: 0 },
  { symbol: "BTC_USDC", name: "US Dollar / Japanese Yen", bid: 0, ask: 0, change: 0, changePercent: 0, volume: 0 },
  { symbol: "AUDUSD", name: "Australian Dollar / US Dollar", bid: 0, ask: 0, change: 0, changePercent: 0, volume: 0 },
  { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", bid: 0, ask: 0, change: 0, changePercent: 0, volume: 0 },
];

interface MarketListProps {
  selectedMarket: string;
  onMarketSelect: (symbol: string) => void;
}

export function MarketList({ selectedMarket, onMarketSelect }: MarketListProps) {
  const [markets, setMarkets] = useState<MarketData[]>(mockMarkets);

  useEffect(() => {
    const handleMessage = (msg: Wsmessage) => {
      try {
        console.log(" [MarketList] Incoming WS msg:", msg);

        if (msg.type === "bidask") {
          const { market, bid, ask } = msg;

          // ✅ Only update if values exist (don’t skip 0)
          if (market !== undefined && bid !== undefined && ask !== undefined) {
            const bidNum = parseFloat(bid as any);
            const askNum = parseFloat(ask as any);

            if (!isNaN(bidNum) && !isNaN(askNum)) {
              setMarkets((prev) =>
                prev.map((m) =>
                  m.symbol === market
                    ? {
                        ...m,
                        bid: bidNum,
                        ask: askNum,
                        // TODO: update change/changePercent if backend provides
                      }
                    : m
                )
              );
            } else {
              console.warn(" [MarketList] Ignoring invalid bid/ask:", msg);
            }
          }
        }
      } catch (e) {
        console.error(" [MarketList] Error in handleMessage:", e, msg);
      }
    };

    const ws = WebSocketManager.getInstance("ws://localhost:8080");
    ws.addListener(handleMessage);
    ws.connect();

    return () => {
      ws.removeListener(handleMessage);
    };
  }, []);

  return (
    <Card className="trading-card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Market Watch</h2>
        <Badge variant="outline" className="text-xs">Live</Badge>
      </div>

      <div className="space-y-2">
        {markets.map((market) => (
          <div
            key={market.symbol}
            onClick={() => onMarketSelect(market.symbol)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
              selectedMarket === market.symbol ? "bg-accent border border-primary/20" : "bg-card/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="font-medium text-sm text-foreground">{market.symbol}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {market.name}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {market.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-buy" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-sell" />
                )}
                <span className={`text-xs ${market.change >= 0 ? "text-buy" : "text-sell"}`}>
                  {market.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Bid</div>
                  <div className="text-sm font-mono text-sell font-semibold">
                    {market.bid.toFixed(market.symbol.includes("JPY") ? 2 : 4)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Ask</div>
                  <div className="text-sm font-mono text-buy font-semibold">
                    {market.ask.toFixed(market.symbol.includes("JPY") ? 2 : 4)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Spread</div>
                <div className="text-sm font-mono text-neutral">
                  {((market.ask - market.bid) * (market.symbol.includes("JPY") ? 100 : 10000)).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
