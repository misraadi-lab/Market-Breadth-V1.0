import React, { useEffect, useRef } from "react";
import { RefreshCw, Gauge as GaugeIcon, Settings2 } from "lucide-react";

/** TradingView Symbol Overview widget (single symbol) */
function TradingViewSymbolOverview({ symbol, height = 260 }) {
  const container = useRef(null);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    s.type = "text/javascript";
    s.async = true;
    s.innerHTML = JSON.stringify({
      symbols: [[symbol]],        // e.g. ["NSE:NIFTY"]
      chartOnly: false,
      width: "100%",
      height,
      locale: "en",
      colorTheme: "dark",
      autosize: true,
      showVolume: false,
      showMA: true,
      hideDateRanges: false,
      hideIdeas: true,
      hideMarketStatus: true,
      hideSymbolLogo: false,
      scalePosition: "no",
      scaleMode: "Normal",
      lineWidth: 2,
      fontFamily: "inherit",
    });

    if (container.current) {
      container.current.innerHTML = "";
      container.current.appendChild(s);
    }
    return () => {
      if (container.current) container.current.innerHTML = "";
    };
  }, [symbol, height]);

  return <div className="tradingview-widget-container" ref={container} />;
}

/** TradingView symbols (exchange-prefixed) */
const INDEXES = [
  { key: "NIFTY",  title: "NIFTY 50",        symbol: "NSE:NIFTY" },
  { key: "BANK",   title: "NIFTY BANK",      symbol: "NSE:BANKNIFTY" },
  { key: "N500",   title: "NIFTY 500",       symbol: "NSE:CNX500" },
  { key: "MID",    title: "NIFTY MIDCAP",    symbol: "NSE:CNXMIDCAP" },
  { key: "SMALL",  title: "NIFTY SMALLCAP",  symbol: "NSE:CNXSMALLCAP" },
  // TradingView widget usually doesn't expose NIFTY MICROCAP 250 as a symbol.
  // If you have a proxy, add it here, e.g. an ETF: { key: "MICRO", title: "NIFTY MICROCAP", symbol: "NSE:XXXX" },
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
                <TradingViewSymbolOverview symbol={idx.symbol} height={260} />
              </div>
            ))}
          </div>
        </div>

        <aside className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 h-fit sticky top-20">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4" />
            <h3 className="font-semibold text-white/90">Controls</h3>
          </div>
          <div className="text-xs text-white/60 space-y-2">
            <p>These blocks embed TradingView’s Symbol Overview widget (delayed data).</p>
            <p>Edit <code>INDEXES</code> to change symbols (use TradingView’s exchange-prefixed format, e.g. <code>NSE:NIFTY</code>).</p>
          </div>
        </aside>
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-8 text-xs text-white/40">
        © {new Date().getFullYear()} Market Breadth — TradingView
      </footer>
    </div>
  );
}
