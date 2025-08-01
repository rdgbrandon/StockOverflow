"use client";
import { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const POPULAR_TICKERS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOG", name: "Alphabet" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "TSLA", name: "Tesla" }
];

const NAME_TO_SYMBOL = POPULAR_TICKERS.reduce((acc, t) => {
  acc[t.name.toUpperCase()] = t.symbol;
  return acc;
}, {
  GOOGLE: "GOOG",
});

export default function BrownianSimulator() {
  const [initialPrice, setInitialPrice] = useState(100);
  const [volatility, setVolatility] = useState(1); // Stored as percentage (1 = 1%)
  const [drift, setDrift] = useState(0.1); // Stored as percentage (0.1 = 0.1%)
  const [days, setDays] = useState(100);
  const [dataPoints, setDataPoints] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  const generateNextPrice = () => {
    setDataPoints((prev) => {
      const lastPrice = prev[prev.length - 1] ?? initialPrice;
      const volDecimal = volatility / 100;
      const driftDecimal = drift / 100;
      const change = Math.random() < 0.5 ? -volDecimal : volDecimal;
      let newPrice = lastPrice * (1 + driftDecimal + change);
      if (newPrice < 0.01) newPrice = 0.01;
      return [...prev, newPrice].slice(-days);
    });
  };

  const startSimulation = () => {
    setDataPoints([initialPrice]);
    setIsRunning(true);
  };

  const stopSimulation = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const normalizeSymbol = (value) => {
    const upper = value.toUpperCase().trim();
    return NAME_TO_SYMBOL[upper] || upper;
  };

  const fetchStats = async () => {
    if (!symbol) return;
    const normalized = normalizeSymbol(symbol);
    setSymbol(normalized);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stockstats?symbol=${normalized}`);
      if (!res.ok) {
        throw new Error('Failed to fetch');
      }
      const json = await res.json();
      if (json.price != null && !isNaN(json.price)) {
        setInitialPrice(parseFloat(json.price.toFixed(2)));
      }
      setVolatility(parseFloat(json.volatility.toFixed(2)));
      setDrift(parseFloat(json.drift.toFixed(2)));
    } catch (err) {
      setError('Could not fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(generateNextPrice, 2000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const chartData = {
    labels: dataPoints.map((_, i) => i + 1),
    datasets: [
      {
        label: "Stock Price",
        data: dataPoints,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        segment: {
          borderColor: (ctx) =>
            ctx.p0.parsed.y <= ctx.p1.parsed.y
              ? "rgba(34,197,94,1)" // green
              : "rgba(239,68,68,1)", // red
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    animation: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Time (Days)",
          color: "#ddd",
          font: { size: 16, weight: "bold" },
        },
        ticks: {
          color: "#ccc",
        },
        grid: {
          color: "rgba(200, 200, 200, 0.1)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Price ($)",
          color: "#ddd",
          font: { size: 16, weight: "bold" },
        },
        ticks: {
          color: "#ccc",
          callback: (value) => `$${value.toFixed(2)}`,
        },
        grid: {
          color: "rgba(200, 200, 200, 0.1)",
        },
        min: dataPoints.length > 0 ? Math.min(...dataPoints) * 0.95 : 0,
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#ddd",
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="p-6 max-w-xl w-full mx-auto bg-gray-900 rounded-lg shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          StockOverflow
        </h1>

        {/* Equation and Variable Explanation */}
        <div className="mb-8 p-4 bg-gray-800 rounded border border-gray-700">
          <div className="text-center mb-4">
            {/* Equation SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="280"
              height="70"
              viewBox="0 0 280 70"
              aria-label="Brownian motion equation"
            >
              <text x="10" y="30" fontSize="24" fontFamily="serif" fill="#ddd">
                dS<tspan baselineShift="sub">t</tspan> = μ S
                <tspan baselineShift="sub">t</tspan> dt + σ S
                <tspan baselineShift="sub">t</tspan> dW
                <tspan baselineShift="sub">t</tspan>
              </text>
            </svg>
          </div>

          <div className="text-sm text-gray-300 space-y-2 max-w-md mx-auto">
            <p>
              <strong>S<sub>t</sub></strong>: Stock price at time <em>t</em> (your Initial Price and generated data)
            </p>
            <p>
              <strong>μ (Drift)</strong>: Expected return rate of the stock. Can be interpreted as the slope of the stock. (Drift % input)
            </p>
            <p>
              <strong>σ (Volatility)</strong>: Random fluctuations or variability. Higher volatility = greater fluctuations (Volatility % input)
            </p>
            <p>
              <strong>dW<sub>t</sub></strong>: Random Brownian motion shock (simulated by random ± volatility changes)
            </p>
            <p>
              <em>Our simulation currently models changes based on the brownian motion equation, which depends on user inputs!</em>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <label className="flex flex-col col-span-2">
            <span className="font-semibold mb-1 text-gray-300">Stock Symbol</span>
            <div className="flex gap-2">
              <div className="flex-grow relative">
                <input
                  type="text"
                  value={symbol}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800"
                />
                {showSuggestions && (
                  <ul className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded mt-1 z-10 max-h-48 overflow-y-auto">
                    {POPULAR_TICKERS.map((t) => (
                      <li key={t.symbol}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setSymbol(t.symbol);
                            setShowSuggestions(false);
                          }}
                          className="block w-full text-left px-3 py-1 hover:bg-gray-700"
                        >
                          {t.symbol} - {t.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                disabled={loading || !symbol}
                onClick={fetchStats}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? "Loading..." : "Fetch"}
              </button>
            </div>
            {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
          </label>
          <label className="flex flex-col">
            <span className="font-semibold mb-1 text-gray-300">Initial Price</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              disabled={isRunning}
              value={initialPrice}
              onChange={(e) =>
                setInitialPrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))
              }
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800"
            />
          </label>

          <label className="flex flex-col">
            <span className="font-semibold mb-1 text-gray-300">Volatility (%)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={isRunning}
              value={volatility}
              onChange={(e) =>
                setVolatility(Math.max(0, parseFloat(e.target.value) || 0))
              }
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800"
            />
          </label>

          <label className="flex flex-col">
            <span className="font-semibold mb-1 text-gray-300">Drift (%)</span>
            <input
              type="number"
              step="0.01"
              disabled={isRunning}
              value={drift}
              onChange={(e) => setDrift(parseFloat(e.target.value) || 0)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800"
            />
          </label>

          <label className="flex flex-col">
            <span className="font-semibold mb-1 text-gray-300">Days (Max Points to Show)</span>
            <input
              type="number"
              min="1"
              max="1000"
              disabled={isRunning}
              value={days}
              onChange={(e) =>
                setDays(Math.min(1000, Math.max(1, parseInt(e.target.value) || 100)))
              }
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800"
            />
          </label>
        </div>

        {/* Start/Stop Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          {!isRunning ? (
            <button
              onClick={startSimulation}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition"
            >
              Start
            </button>
          ) : (
            <button
              onClick={stopSimulation}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition"
            >
              Stop
            </button>
          )}
        </div>

        {/* Chart */}
        {dataPoints.length > 0 && (
          <div>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
