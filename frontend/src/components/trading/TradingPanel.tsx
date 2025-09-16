import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TradingPanelProps {
  symbol: string;
  currentPrice: number;
}

export function TradingPanel({ symbol, currentPrice = 1.0846 }: TradingPanelProps) {
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [volume, setVolume] = useState("0.01"); // now volume in lots
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  const handleBuy = () => {
    console.log("Buy order:", { symbol, volume, orderType, stopLoss, takeProfit, limitPrice });
  };

  const handleSell = () => {
    console.log("Sell order:", { symbol, volume, orderType, stopLoss, takeProfit, limitPrice });
  };

  const quickVolumes = ["0.01", "0.05", "0.1", "0.5"];

  return (
    <Card className="trading-card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Trading Panel</h2>
        <Badge variant="outline" className="text-xs">{symbol}</Badge>
      </div>

      <Tabs value={orderType} onValueChange={(value) => setOrderType(value as any)} className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="limit">Limit</TabsTrigger>
          <TabsTrigger value="stop">Stop</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-4 mt-4">
          <div className="text-center p-3 bg-accent/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Current Price</div>
            <div className="text-xl font-mono font-bold text-foreground">
              {currentPrice.toFixed(4)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="limit" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="limitPrice" className="text-sm">Limit Price</Label>
            <Input
              id="limitPrice"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="Enter limit price"
              className="mt-1"
            />
          </div>
        </TabsContent>

        <TabsContent value="stop" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="stopPrice" className="text-sm">Stop Price</Label>
            <Input
              id="stopPrice"
              placeholder="Enter stop price"
              className="mt-1"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Volume Input */}
      <div className="space-y-2 mt-2">
        <Label htmlFor="volume" className="text-sm font-medium">Volume (Lots)</Label>
        <Input
          id="volume"
          type="number"
          step="0.01"
          min="0.01"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="text-center font-mono text-lg"
        />
        <div className="grid grid-cols-4 gap-1 mt-1">
          {quickVolumes.map((vol) => (
            <Button
              key={vol}
              variant={volume === vol ? "default" : "outline"}
              size="sm"
              onClick={() => setVolume(vol)}
              className="text-xs font-medium"
            >
              {vol}
            </Button>
          ))}
        </div>
      </div>

      {/* Stop Loss / Take Profit */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <Label htmlFor="stopLoss" className="text-sm font-medium">Stop Loss</Label>
          <Input
            id="stopLoss"
            type="number"
            step="0.0001"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="1.0800"
            className="mt-1 font-mono"
          />
        </div>
        <div>
          <Label htmlFor="takeProfit" className="text-sm font-medium">Take Profit</Label>
          <Input
            id="takeProfit"
            type="number"
            step="0.0001"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="1.0900"
            className="mt-1 font-mono"
          />
        </div>
      </div>

      {/* Buy/Sell Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-4">
        <Button
          onClick={handleBuy}
          className="bg-buy hover:bg-buy/90 text-white font-semibold py-3 glow-buy"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          BUY
        </Button>
        <Button
          onClick={handleSell}
          className="bg-sell hover:bg-sell/90 text-white font-semibold py-3 glow-sell"
        >
          <TrendingDown className="w-4 h-4 mr-2" />
          SELL
        </Button>
      </div>
    </Card>
  );
}
