import React, { useEffect, useRef } from "react";
import { RefreshCw, Gauge as GaugeIcon, Settings2 } from "lucide-react";

/** Inline TradingView mini-widget */
function TradingViewWidget({ symbol = "NSE:NIFTY", height = 220, dateRange = "1M" }) {
  const container = useRef(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,                // e.g. "NSE:NIFTY"
      width: "100%",
      height,
      locale: "en",
      dateRange,             // "1D","5D","1M","3M","6M","12M","60M","ALL"
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",     // optional: set to open full chart on click
    });

    // Clear & mount
    container.current.innerHTML = "";
    container.current.appendChild(script);

    // Cleanup not strictly needed for this script tag
    return () => {
      if (container.current) container.current.innerHTML = "";
    };
  }, [symbol, height, dateRange]);

  return <div className="tradingview-widget-container" ref={container} />;
}

/** TradingView symbols for Indian indices (adjust if needed) */
const INDEXES = [
  { key: "NIFTY", title: "NIFTY 50", symbol: "NSE:NIFTY" },
  { key: "BANK", title: "NIFTY BANK", symbol: "NSE:BANKNIFTY" },
  { key: "N500", title: "NIFTY 500", symbol: "NSE:CNX500" },      // update if your TV symbol differs
  { key: "MID", title: "NIFTY MIDCAP", symbol: "NSE:MIDCAP" },    // update if needed
  { key: "SMALL", title: "NIFTY SMALLCAP", symbol: "NSE:SMALLCAP" }, // update if needed
  { key: "MICRO", title: "NIFTY MICROCAP", symbol: "NSE:MICROCAP" }, // update if needed / proxy
];

export default function App() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-slate-900/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 grid place-items-center">
              <GaugeIcon className="w-4 h-4 text-emerald-300" />
            </div>
            <h1 className="text-lg font-semibold tracking-wide">Market Breadth — TradingView</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button
              className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 hover:bg-slate-800 flex items-center gap-2"
              onClick={() => location.reload()}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            {INDEXES.map((idx) => (
              <div key={idx.key} className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/90 font-semibold tracking-wide">{idx.title}</h3>
                </div>
                <TradingViewWidget symbol={idx.symbol} height={220} dateRange="1M" />
              </div>
            ))}
          </div>
        </div>

        {/* Right-side panel (optional controls placeholder) */}
        <aside className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 h-fit sticky top-20">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4" />
            <h3 className="font-semibold text-white/90">Controls</h3>
          </div>
          <div className="text-xs text-white/60 space-y-2">
            <p>These blocks embed TradingView’s mini symbol widgets.</p>
            <p>
              To change a symbol, edit <code>INDEXES</code> (e.g. <code>NSE:NIFTY</code>,{" "}
              <code>NSE:BANKNIFTY</code>, <code>BSE:SENSEX</code>).
            </p>
            <p>Data is delayed on the free widget.</p>
          </div>
        </aside>
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-8 text-xs text-white/40">
        © {new Date().getFullYear()} Market Breadth — TradingView
      </footer>
    </div>
  );
}
