import { useState } from "react";
import { MarketList } from "@/components/trading/MarketList";
import { SimpleChart } from "@/components/trading/SimpleChart";
import { TradingPanel } from "@/components/trading/TradingPanel";
import { TradeHistory } from "@/components/trading/TradeHistory";

const Index = () => {
  const [selectedMarket, setSelectedMarket] = useState("SOL_USDC");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-primary">TradingPro</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-buy rounded-full animate-pulse"></div>
                <span>Live Market Data</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-right">
                <div className="text-muted-foreground">Balance</div>
                <div className="font-mono font-semibold text-foreground">$10,000.00</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground">Equity</div>
                <div className="font-mono font-semibold text-buy">$10,033.50</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground">Margin</div>
                <div className="font-mono font-semibold text-foreground">$65.07</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Trading Interface */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Market List */}
          <div className="col-span-3">
            <MarketList 
              selectedMarket={selectedMarket}
              onMarketSelect={setSelectedMarket}
            />
          </div>

          {/* Center - Trading Chart */}
          <div className="col-span-6">
            <SimpleChart symbol={selectedMarket} />
          </div>

          {/* Right Sidebar - Trading Panel */}
          <div className="col-span-3">
            <TradingPanel symbol={selectedMarket} currentPrice={1.0846} />
          </div>
        </div>

        {/* Bottom Section - Trade History */}
        <div className="mt-24">
          <TradeHistory />
        </div>
      </div>
    </div>
  );
};

export default Index;
