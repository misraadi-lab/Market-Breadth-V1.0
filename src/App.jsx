import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, RefreshCw, Settings2, Gauge as GaugeIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

/**
 * Market Breadth Console — Concept Prototype (Simulated Data)
 * - Composite breadth gauge (0–100)
 * - 6 Blocks, each with 1D / 60m / 15m mini-charts
 * - Bar-color logic (green if Low>SMA, red if High<SMA, else gray)
 * - Per-TF score + block score + adjustable weights
 * - TailwindCSS styling, Recharts for charts
 */

// ---------- Helpers: simulated data & SMA ----------
function randWalk(len, start = 100, drift = 0.02, vol = 0.6) {
  const out = [];
  let x = start;
  for (let i = 0; i < len; i++) {
    const step = drift + (Math.random() - 0.5) * vol;
    x = Math.max(1, x + step);
    const high = x + Math.random() * 0.6;
    const low = x - Math.random() * 0.6;
    const open = x + (Math.random() - 0.5) * 0.4;
    const close = x;
    out.push({ i, open, high, low, close });
  }
  return out;
}

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

// ---------- Scoring ----------
function perTFScore(series, sma, deadbandPct = 0.0005) {
  const n = series.length;
  if (n < 3) return 0;
  const c = series[n - 1].close;
  const s = sma[n - 1];
  const sPrev = sma[n - 2];
  if (s == null || sPrev == null) return 0;
  const db = Math.abs(s) * deadbandPct;
  const pos = c > s + db ? 1 : c < s - db ? -1 : 0; // price vs SMA
  const slope = s > sPrev + db ? 1 : s < sPrev - db ? -1 : 0; // SMA slope
  return pos + slope; // in {-2, -1, 0, 1, 2}
}

// ---------- UI atoms ----------
const Pill = ({ value }) => {
  const bg = value >= 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300";
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${bg} border border-white/10`}>{value.toFixed(1)}</span>
  );
};

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input type="checkbox" className="accent-emerald-400" checked={checked} onChange={(e)=>onChange(e.target.checked)} />
    <span className="text-sm text-white/80">{label}</span>
  </label>
);

// Simple SVG gauge 0..100
function GaugeArc({ value }) {
  const v = Math.max(0, Math.min(100, value));
  const start = 135; // degrees
  const end = 45; // degrees
  const range = 270; // arc sweep
  const angle = start + (v / 100) * range;

  const polar = (deg, r) => {
    const rad = (deg * Math.PI) / 180;
    return [150 + r * Math.cos(rad), 150 + r * Math.sin(rad)];
  };

  const [sx, sy] = polar(start, 120);
  const [ex, ey] = polar(end + 360, 120);
  const largeArc = range > 180 ? 1 : 0;
  const [nx, ny] = polar(angle, 120);

  const color = value >= 60 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <svg viewBox="0 0 300 220" className="w-full h-40">
      <path d={`M ${sx} ${sy} A 120 120 0 ${largeArc} 1 ${ex} ${ey}`} stroke="#334155" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d={`M ${sx} ${sy} A 120 120 0 ${largeArc} 1 ${nx} ${ny}`} stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" />
      <circle cx={nx} cy={ny} r="6" fill={color} />
      <text x="150" y="160" textAnchor="middle" className="fill-white/80 text-xl font-semibold">{Math.round(value)}</text>
      <text x="150" y="185" textAnchor="middle" className="fill-white/60 text-xs">Breadth</text>
    </svg>
  );
}

// ---------- Block TF mini-chart ----------
function TFCard({ tfLabel, data, sma, maLen }) {
  const s = sma[sma.length - 1];
  const score = perTFScore(data, sma);

  const bars = data.map((d, i) => ({
    x: i,
    close: d.close,
    sma: sma[i],
    // bar color rule
    color: d.low > (sma[i] ?? Infinity) ? "#10b981" : d.high < (sma[i] ?? -Infinity) ? "#ef4444" : "#9ca3af",
  }));

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>{tfLabel} • MA {maLen}</span>
        <Pill value={score} />
      </div>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={bars} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.35}/>
                <stop offset="100%" stopColor="#64748b" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#0f172a" strokeDasharray="3 3" />
            <XAxis dataKey="x" hide />
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 8 }} labelStyle={{ color: "#94a3b8" }} />
            <Area type="monotone" dataKey="close" stroke="#93c5fd" fill="url(#grad)" strokeWidth={1.4} />
            <ReferenceLine y={s} stroke="#eab308" strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------- Block (3 TFs) ----------
function BlockCard({ title, maLen, tfOn }) {
  // Simulate three TF series with slightly different drift/vol
  const d1 = useMemo(() => randWalk(220, 100, 0.04, 0.7), []); // 1D
  const h1 = useMemo(() => randWalk(240, 100, 0.02, 0.8), []); // 60m
  const m15 = useMemo(() => randWalk(240, 100, 0.01, 1.0), []); // 15m

  const smaD = useMemo(() => rollingSMA(d1, maLen), [d1, maLen]);
  const smaH = useMemo(() => rollingSMA(h1, maLen), [h1, maLen]);
  const smaM = useMemo(() => rollingSMA(m15, maLen), [m15, maLen]);

  const sD = perTFScore(d1, smaD);
  const sH = perTFScore(h1, smaH);
  const sM = perTFScore(m15, smaM);

  const blockScore = (tfOn.daily ? 2 * sD : 0) + (tfOn.h1 ? 1.5 * sH : 0) + (tfOn.m15 ? 1 * sM : 0);
  const maxAbs = (tfOn.daily ? 2 * 2 : 0) + (tfOn.h1 ? 1.5 * 2 : 0) + (tfOn.m15 ? 1 * 2 : 0);
  const norm = maxAbs > 0 ? blockScore / maxAbs : 0; // -1..+1

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-white/90 font-semibold tracking-wide">{title}</h3>
        </div>
        <Pill value={blockScore} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {tfOn.daily && <TFCard tfLabel="1D" data={d1} sma={smaD} maLen={maLen} />}
        {tfOn.h1 && <TFCard tfLabel="60m" data={h1} sma={smaH} maLen={maLen} />}
        {tfOn.m15 && <TFCard tfLabel="15m" data={m15} sma={smaM} maLen={maLen} />}
      </div>
      <div className="text-xs text-white/60 mt-1">Weighted score normalized: {(50 + 50 * norm).toFixed(0)} / 100</div>
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [maLen, setMaLen] = useState(50);
  const [tfOn, setTfOn] = useState({ daily: true, h1: true, m15: true });
  const [weights, setWeights] = useState({
    NIFTY: 0.25,
    BANK: 0.2,
    N500: 0.2,
    MID: 0.15,
    SMALL: 0.12,
    MICRO: 0.08,
  });

  const blocks = [
    { key: "NIFTY", title: "NIFTY 50" },
    { key: "BANK", title: "NIFTY BANK" },
    { key: "N500", title: "NIFTY 500" },
    { key: "MID", title: "NIFTY MIDCAP" },
    { key: "SMALL", title: "NIFTY SMALLCAP" },
    { key: "MICRO", title: "NIFTY MICROCAP" },
  ];

  const composite = useMemo(() => {
    const tfWeight = { daily: 2, h1: 1.5, m15: 1 };
    let sum = 0, wsum = 0;
    for (const b of blocks) {
      const d1 = randWalk(140, 100, 0.04, 0.7);
      const h1 = randWalk(160, 100, 0.02, 0.8);
      const m15 = randWalk(160, 100, 0.01, 1.0);
      const sD = perTFScore(d1, rollingSMA(d1, maLen));
      const sH = perTFScore(h1, rollingSMA(h1, maLen));
      const sM = perTFScore(m15, rollingSMA(m15, maLen));
      const blockScore = (tfOn.daily ? tfWeight.daily * sD : 0) + (tfOn.h1 ? tfWeight.h1 * sH : 0) + (tfOn.m15 ? tfWeight.m15 * sM : 0);
      const maxAbs = (tfOn.daily ? tfWeight.daily * 2 : 0) + (tfOn.h1 ? tfWeight.h1 * 2 : 0) + (tfOn.m15 ? tfWeight.m15 * 2 : 0);
      const norm = maxAbs > 0 ? blockScore / maxAbs : 0; // -1..+1
      const w = weights[b.key];
      sum += w * norm;
      wsum += w;
    }
    const finalNorm = wsum > 0 ? sum / wsum : 0; // -1..+1
    return Math.round((finalNorm + 1) * 50); // 0..100
  }, [maLen, tfOn, weights]);

  const weightLabels = {
    NIFTY:"NIFTY 50", BANK:"NIFTY BANK", N500:"NIFTY 500", MID:"MIDCAP", SMALL:"SMALLCAP", MICRO:"MICROCAP"
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-slate-900/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 grid place-items-center">
              <GaugeIcon className="w-4 h-4 text-emerald-300" />
            </div>
            <h1 className="text-lg font-semibold tracking-wide">Market Breadth Console — Concept</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span className="text-white/80">Composite</span>
              <span className="font-semibold text-emerald-300">{composite}</span>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 hover:bg-slate-800 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: Gauge + Blocks */}
        <div className="flex flex-col gap-6">
          {/* Composite Gauge Card */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-white/90 font-semibold">Breadth Meter</h2>
                <span className={`px-2 py-0.5 text-xs rounded-full border border-white/10 ${composite>=60?"bg-emerald-500/15 text-emerald-300": composite>=40?"bg-amber-500/15 text-amber-300":"bg-rose-500/15 text-rose-300"}`}>
                  {composite>=60?"Bullish": composite>=40?"Mixed":"Bearish"}
                </span>
              </div>
              <div className="text-xs text-white/60">0 weak • 100 strong</div>
            </div>
            <GaugeArc value={composite} />
          </div>

          {/* Blocks Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {blocks.map((b) => (
              <BlockCard key={b.key} title={b.title} maLen={maLen} tfOn={tfOn} />
            ))}
          </div>
        </div>

        {/* Right: Controls */}
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

            <div className="pt-2 border-t border-white/10">
              <div className="text-xs text-white/60 mb-2">Weights (Composite)</div>
              {Object.entries(weights).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 mb-2">
                  <div className="w-28 text-sm text-white/80">{weightLabels[k]}</div>
                  <input type="range" min={0} max={50} value={Math.round(v*100)} onChange={(e)=>{
                    const vv = parseInt(e.target.value)/100; setWeights(w=>({...w,[k]:vv}))
                  }} className="flex-1" />
                  <div className="w-10 text-right text-sm">{(v*100).toFixed(0)}%</div>
                </div>
              ))}
              <div className="text-xs text-white/50">Tip: Weights auto-normalize into the 0–100 breadth score.</div>
            </div>

            <div className="pt-2 border-t border-white/10 text-xs text-white/60">
              This is a <span className="text-white">simulated</span> console to finalize layout & scoring. Next step: plug Zerodha API for real candles & live updates.
            </div>
          </div>
        </aside>
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-8 text-xs text-white/40">
        © {new Date().getFullYear()} Breadth Console · Concept Prototype
      </footer>
    </div>
  );
}
