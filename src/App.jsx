import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";

export default function App() {
  const chartContainerRef = useRef();
  const [symbol, setSymbol] = useState("^NSEI"); // NIFTY50 default
  const [interval, setInterval] = useState("1d");
  const chartRef = useRef();
  const candleSeriesRef = useRef();
  const smaSeriesRef = useRef();

  // fetch Yahoo candles
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/yahoo?symbol=${symbol}&interval=${interval}`);
      const data = await res.json();

      if (!data || !data.quotes) return;
      const candles = data.quotes.map(d => ({
        time: Math.floor(new Date(d.date).getTime() / 1000),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      candleSeriesRef.current.setData(candles);

      // simple SMA overlay
      const len = 20;
      const sma = candles.map((c, i) => {
        if (i < len) return null;
        const slice = candles.slice(i - len, i);
        const avg = slice.reduce((s, d) => s + d.close, 0) / len;
        return { time: c.time, value: avg };
      }).filter(Boolean);
      smaSeriesRef.current.setData(sma);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "#0f172a" },
          textColor: "#cbd5e1",
        },
        grid: {
          vertLines: { color: "#1e293b" },
          horzLines: { color: "#1e293b" },
        },
        crosshair: { mode: 1 },
        timeScale: { borderColor: "#475569" },
      });

      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: "#22c55e",
        borderUpColor: "#22c55e",
        wickUpColor: "#22c55e",
        downColor: "#ef4444",
        borderDownColor: "#ef4444",
        wickDownColor: "#ef4444",
      });

      smaSeriesRef.current = chartRef.current.addLineSeries({
        color: "#eab308",
        lineWidth: 2,
      });
    }
    fetchData();
  }, [symbol, interval]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold">📈 TradingView Clone — Yahoo Data</h1>
        <div className="flex gap-2">
          <select value={symbol} onChange={e => setSymbol(e.target.value)} className="text-black px-2 py-1 rounded">
            <option value="^NSEI">NIFTY 50</option>
            <option value="^NSEBANK">BANKNIFTY</option>
            <option value="^CRSLDX">NIFTY 500</option>
            <option value="^CRSMID">NIFTY MIDCAP</option>
          </select>
          <select value={interval} onChange={e => setInterval(e.target.value)} className="text-black px-2 py-1 rounded">
            <option value="1d">1D</option>
            <option value="1h">1H</option>
            <option value="15m">15m</option>
          </select>
        </div>
      </header>

      <div ref={chartContainerRef} style={{ width: "100%", height: "80vh" }} />
    </div>
  );
}
