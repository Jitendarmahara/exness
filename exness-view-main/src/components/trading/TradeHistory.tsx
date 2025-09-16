import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  openPrice: number;
  currentPrice?: number;
  closePrice?: number;
  profit?: number;
  status: "open" | "closed" | "pending";
  openTime: Date;
  closeTime?: Date;
  stopLoss?: number;
  takeProfit?: number;
}

const mockTrades: Trade[] = [
  {
    id: "1",
    symbol: "EURUSD",
    type: "buy",
    volume: 0.1,
    openPrice: 1.0845,
    currentPrice: 1.0856,
    profit: 11.0,
    status: "open",
    openTime: new Date(Date.now() - 3600000),
    stopLoss: 1.0825,
    takeProfit: 1.0875,
  },
  {
    id: "2",
    symbol: "GBPUSD",
    type: "sell",
    volume: 0.05,
    openPrice: 1.2634,
    currentPrice: 1.2628,
    profit: 3.0,
    status: "open",
    openTime: new Date(Date.now() - 1800000),
  },
  {
    id: "3",
    symbol: "USDJPY",
    type: "buy",
    volume: 0.2,
    openPrice: 149.23,
    closePrice: 149.45,
    profit: 44.0,
    status: "closed",
    openTime: new Date(Date.now() - 7200000),
    closeTime: new Date(Date.now() - 3600000),
  },
  {
    id: "4",
    symbol: "EURUSD",
    type: "sell",
    volume: 0.15,
    openPrice: 1.0862,
    closePrice: 1.0847,
    profit: -22.5,
    status: "closed",
    openTime: new Date(Date.now() - 10800000),
    closeTime: new Date(Date.now() - 5400000),
  },
];

export function TradeHistory() {
  const [trades] = useState<Trade[]>(mockTrades);

  const openTrades = trades.filter(trade => trade.status === "open");
  const closedTrades = trades.filter(trade => trade.status === "closed");
  const pendingTrades = trades.filter(trade => trade.status === "pending");

  const totalProfit = openTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const closedProfit = closedTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const TradeRow = ({ trade }: { trade: Trade }) => (
    <div key={trade.id} className="p-3 bg-card/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Badge 
            variant={trade.type === "buy" ? "default" : "destructive"}
            className={`text-xs ${
              trade.type === "buy" 
                ? "bg-buy/20 text-buy border-buy/30" 
                : "bg-sell/20 text-sell border-sell/30"
            }`}
          >
            {trade.type === "buy" ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {trade.type.toUpperCase()}
          </Badge>
          <span className="font-semibold text-sm">{trade.symbol}</span>
          <span className="text-xs text-muted-foreground">
            {trade.volume} lots
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {trade.status === "open" && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Open
            </Badge>
          )}
          {trade.status === "closed" && (
            <Badge variant="outline" className="text-xs">
              {(trade.profit || 0) >= 0 ? (
                <CheckCircle className="w-3 h-3 mr-1 text-buy" />
              ) : (
                <XCircle className="w-3 h-3 mr-1 text-sell" />
              )}
              Closed
            </Badge>
          )}
          <span className={`font-mono font-semibold text-sm ${
            (trade.profit || 0) >= 0 ? "text-buy" : "text-sell"
          }`}>
            {trade.profit && trade.profit >= 0 ? "+" : ""}
            ${trade.profit?.toFixed(2)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-muted-foreground">Open Price</div>
          <div className="font-mono text-foreground">
            {trade.openPrice.toFixed(trade.symbol.includes("JPY") ? 2 : 4)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">
            {trade.status === "open" ? "Current" : "Close"} Price
          </div>
          <div className="font-mono text-foreground">
            {trade.status === "open" 
              ? trade.currentPrice?.toFixed(trade.symbol.includes("JPY") ? 2 : 4)
              : trade.closePrice?.toFixed(trade.symbol.includes("JPY") ? 2 : 4)
            }
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Time</div>
          <div className="text-foreground">
            {formatTime(trade.openTime)}
            <div className="text-muted-foreground">
              {formatDate(trade.openTime)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="trading-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Trading Activity</h2>
        <div className="flex space-x-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">Open P&L</div>
            <div className={`font-mono font-semibold ${
              totalProfit >= 0 ? "text-buy" : "text-sell"
            }`}>
              {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Closed P&L</div>
            <div className={`font-mono font-semibold ${
              closedProfit >= 0 ? "text-buy" : "text-sell"
            }`}>
              {closedProfit >= 0 ? "+" : ""}${closedProfit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="open">
            Open ({openTrades.length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({closedTrades.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingTrades.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="open" className="space-y-3 mt-4">
          {openTrades.length > 0 ? (
            openTrades.map(trade => <TradeRow key={trade.id} trade={trade} />)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No open positions
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="closed" className="space-y-3 mt-4">
          {closedTrades.length > 0 ? (
            closedTrades.map(trade => <TradeRow key={trade.id} trade={trade} />)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No closed trades
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-3 mt-4">
          <div className="text-center py-8 text-muted-foreground">
            No pending orders
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}