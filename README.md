# Market Breadth — Yahoo (Free, Delayed)

This version uses **Yahoo Finance** free endpoints (15m delayed intraday, EOD daily) via a serverless API on **Vercel**. No broker keys required.

## Deploy on Vercel
- Framework: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

## API
- `GET /api/candles?symbol=^NSEI&interval=1d&range=6mo`
  - `interval`: `1d`, `15m`, `60m`
  - `range`: e.g., `6mo`, `10d`, `5d`, `1y` (Yahoo-compatible)
- The frontend calls:
  - NIFTY: `^NSEI`
  - BANKNIFTY: `^NSEBANK`
  - Others use reasonable proxies and can be edited in `src/App.jsx`.

## Notes
- Data is **delayed** and subject to Yahoo’s availability.
- If a symbol doesn’t exist, adjust the ticker in `INDEXES` in `src/App.jsx`.
- You can add a symbol picker UI and persist preferences to `localStorage`.
