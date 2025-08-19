import React, { useEffect, useRef } from "react";

export default function TradingViewWidget({ symbol }) {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,         // example: "NSE:NIFTY"
      width: "100%",
      height: "220",
      locale: "en",
      dateRange: "1M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",      // optional full-chart link
    });

    container.current.innerHTML = "";
    container.current.appendChild(script);
  }, [symbol]);

  return <div className="tradingview-widget-container" ref={container} />;
}
