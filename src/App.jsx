import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Settings2, Gauge as GaugeIcon } from "lucide-react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

const INDEXES = [
  { key: "NIFTY", title: "NIFTY 50", symbol: "^NSEI" },
  { key: "BANK",  title: "NIFTY BANK", symbol: "^NSEBANK" },
  { key: "N500",  title: "NIFTY 500", symbol: "^CRSLDX" },     // adjust if needed
  { key: "MID",   title: "NIFTY MIDCAP", symbol: "^CRSMID" },  // adjust if needed
  { key: "SMALL", title: "NIFTY SMALLCAP", symbol: "NIFTYSMALL.NS" }, // proxy
  { key: "MICRO", title: "NIFTY MICROCAP", symbol: "SMALCAP.NS" }     // proxy
];

function rollingSMA(series, len) {
  const sma = new Array(series.length).fill(null);
  let sum = 0;
  for (let i = 0; i < series.length; i++) {
    sum += series[i].close;
    if (i >= len) sum -= series[i - len].close;
    if (i >= len - 1) sma[i] = sum / len;
  }
  return sma;
}
function perTFScore(series, sma, deadbandPct = 0.0005) {
  const n = series.length;
  if (n < 3) return 0;
  const c = series[n - 1].close;
  const s = sma[n - 1];
  const sPrev = sma[n - 2];
  if (s == null || sPrev == null) return 0;
  const db = Math.abs(s) * deadbandPct;
  const pos = c > s + db ? 1 : c < s - db ? -1 : 0;
  const slope = s > sPrev + db ? 1 : s < sPrev - db ? -1 : 0;
  return pos + slope;
}

const Pill = ({ value }) => {
  const bg = value >= 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300";
  return <span className={`px-2 py-0.5 text-xs rounded-full ${bg} border border-white/10`}>{(value || 0).toFixed(1)}</span>;
};

// ---------- NEW TFCard (moving SMA line + rich tooltip) ----------
function TFCard({ tfLabel, candles, maLen }) {
  const nf = useMemo(() => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }), []);
  const df = useMemo(() => new Intl.DateTimeFormat("en-GB", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
  }), []);

  const sma = useMemo(() => rollingSMA(candles, maLen), [candles, maLen]);
  const score = perTFScore(candles, sma);

  const data = useMemo(() => candles.map((d, i) => ({
    i,
    timeISO: d.time,
    timeLabel: df.format(new Date(d.time)),
    open: d.open, high: d.high, low: d.low, close: d.close,
    sma: sma[i],
  })), [candles, sma, df]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload;
    return (
      <div style={{
        background: "#0b1220", border: "1px solid #1f2937",
        borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#cbd5e1"
      }}>
        <div style={{ fontWeight: 600, color: "#93c5fd", marginBottom: 4 }}>{p.timeLabel}</div>
        <div>Open: <b>{nf.format(p.open)}</b></div>
        <div>High: <b>{nf.format(p.high)}</b></div>
        <div>Low:  <b>{nf.format(p.low)}</b></div>
        <div>Close:<b>{nf.format(p.close)}</b></div>
        {p.sma != null && <div style={{ color: "#eab308" }}>SMA{maLen}: <b>{nf.format(p.sma)}</b></div>}
      </div>
    );
  };

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>{tfLabel} • MA {maLen}</span>
        <span className={`px-2 py-0.5 text-xs rounded-full border border-white/10 ${score >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
          {score.toFixed(1)}
        </span>
      </div>

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.35}/>
                <stop offset="100%" stopColor="#64748b" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#0f172a" strokeDasharray="3 3" />
            <XAxis dataKey="i" hide />
            <YAxis hide domain={["auto","auto"]} />
            <Tooltip content={<CustomTooltip />} />
            {/* Price area */}
            <Area type="monotone" dataKey="close" stroke="#93c5fd" fill="url(#grad)" strokeWidth={1.4} />
            {/* Moving Average line */}
            <Line type="monotone" dataKey="sma" stroke="#eab308" strokeWidth={1.4} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
// -----------------------------------------------------------------

function useYahooCandles(symbol, interval, range) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&interval=${interval}&range=${range}`);
      if (res.ok) {
        const json = await res.json();
        if (alive) setData(json.candles);
      } else if (alive) {
        setData([]);
      }
    })();
    return () => { alive = false; };
  }, [symbol, interval, range]);
  return data;
}

function BlockCard({ title, symbol, maLen, tfOn }) {
  const d1  = useYahooCandles(symbol, "1d", "6mo");
  const h1  = useYahooCandles(symbol, "60m", "10d");
  const m15 = useYahooCandles(symbol, "15m", "5d");

  const score = useMemo(() => {
    const s = (arr) => (arr && arr.length) ? perTFScore(arr, rollingSMA(arr, maLen)) : 0;
    return (tfOn.daily ? 2 * s(d1) : 0) + (tfOn.h1 ? 1.5 * s(h1) : 0) + (tfOn.m15 ? 1 * s(m15) : 0);
  }, [d1, h1, m15, maLen, tfOn]);

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-white/90 font-semibold tracking-wide">{title}</h3>
        </div>
        <Pill value={score} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {tfOn.daily && d1  && d1.length  > 0 && <TFCard tfLabel="1D"  candles={d1}  maLen={maLen} />}
        {tfOn.h1    && h1  && h1.length  > 0 && <TFCard tfLabel="60m" candles={h1}  maLen={maLen} />}
        {tfOn.m15   && m15 && m15.length > 0 && <TFCard tfLabel="15m" candles={m15} maLen={maLen} />}
      </div>
      <div className="text-xs text-white/60 mt-1">Source: Yahoo Finance (delayed)</div>
    </div>
  );
}

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input type="checkbox" className="accent-emerald-400" checked={checked} onChange={(e)=>onChange(e.target.checked)} />
    <span className="text-sm text-white/80">{label}</span>
  </label>
);

export default function App() {
  const [maLen, setMaLen] = useState(50);
  const [tfOn, setTfOn] = useState({ daily: true, h1: true, m15: true });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-slate-900/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 grid place-items-center">
              <GaugeIcon className="w-4 h-4 text-emerald-300" />
            </div>
            <h1 className="text-lg font-semibold tracking-wide">Market Breadth — Yahoo (Free)</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 hover:bg-slate-800 flex items-center gap-2" onClick={()=>location.reload()}>
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            {INDEXES.map(b => (
              <BlockCard key={b.key} title={b.title} symbol={b.symbol} maLen={maLen} tfOn={tfOn} />
            ))}
          </div>
        </div>

        <aside className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 h-fit sticky top-20">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4" />
            <h3 className="font-semibold text-white/90">Controls</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-1">Moving Average Length</label>
              <input type="range" min={10} max={200} value={maLen} onChange={(e)=>setMaLen(parseInt(e.target.value))} className="w-full" />
              <div className="text-sm text-white/80">MA = <span className="font-semibold">{maLen}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Toggle label="1D" checked={tfOn.daily} onChange={(v)=>setTfOn({...tfOn, daily:v})} />
              <Toggle label="60m" checked={tfOn.h1} onChange={(v)=>setTfOn({...tfOn, h1:v})} />
              <Toggle label="15m" checked={tfOn.m15} onChange={(v)=>setTfOn({...tfOn, m15:v})} />
            </div>
            <div className="pt-2 border-t border-white/10 text-xs text-white/60">
              Uses free Yahoo Finance data (delayed). Symbols can be edited in the code if needed.
            </div>
          </div>
        </aside>
      </main>
      <footer className="max-w-7xl mx-auto px-4 pb-8 text-xs text-white/40">© {new Date().getFullYear()} Market Breadth — Yahoo</footer>
    </div>
  );
}
