import yahooFinance from "yahoo-finance2";

export default async function handler(req, res) {
  const { symbol = "^NSEI", interval = "1d" } = req.query;

  try {
    const result = await yahooFinance.chart(symbol, { interval, range: "3mo" });
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}
