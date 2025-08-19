// /api/candles?symbol=^NSEI&interval=1d&range=6mo
export default async function handler(req, res) {
  try {
    const symbol = req.query.symbol || '^NSEI';
    const interval = req.query.interval || '1d'; // 1d, 15m, 60m
    const range = req.query.range || (interval === '1d' ? '6mo' : '5d');
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}&includePrePost=false`;

    const r = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; MarketBreadthBot/1.0)'
      }
    });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).send(txt);
    }
    const json = await r.json();
    const result = json?.chart?.result?.[0];
    if (!result) return res.status(404).send('No data');

    const ts = result.timestamp || [];
    const o = result.indicators?.quote?.[0]?.open || [];
    const h = result.indicators?.quote?.[0]?.high || [];
    const l = result.indicators?.quote?.[0]?.low || [];
    const c = result.indicators?.quote?.[0]?.close || [];
    const v = result.indicators?.quote?.[0]?.volume || [];

    const candles = ts.map((t, i) => ({
      time: new Date(t * 1000).toISOString(),
      open: o[i] ?? null,
      high: h[i] ?? null,
      low: l[i] ?? null,
      close: c[i] ?? null,
      volume: v[i] ?? 0
    })).filter(x => x.close != null);

    res.status(200).json({ symbol, interval, range, candles });
  } catch (e) {
    res.status(500).send(String(e));
  }
}
