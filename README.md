# StockOverflow Simulator

This project contains a simple Next.js application that visualizes a Brownian motion style stock price simulation. A small API route fetches historical data from Yahoo Finance so the simulator can be seeded with more realistic drift and volatility values.

## Installation and Running

Open the app on https://stock-overflow-auto.vercel.app/

Or Manually

1. Install dependencies:
   ```bash
   npm install
   npm install react-chartjs-2 chart.js
   ```
2. Start the development server:
   ```bash
   npx next dev
   ```
3. Open `http://localhost:3000` in your browser and click **Launch Simulator** to access the Brownian page.

## App Structure

- `app/page.js` – landing page with a button that routes to `/brownian`.
- `app/brownian/page.js` – main simulation UI built with React and Chart.js.
- `app/api/stockstats/route.js` – API endpoint that fetches drift and volatility for a ticker.
- `app/layout.js` – global layout and fonts.
- `app/globals.css` – Tailwind CSS styles.

A Mermaid diagram describing the high level flow is provided in `StockOverflow Diagram _ Mermaid Chart-2025-07-28-191650.svg`.

## Brownian Motion Simulation

The simulator maintains state for the current price, drift, volatility, and number of days. Every two seconds it generates the next price using a basic Brownian motion step:

```javascript
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
```
【F:app/brownian/page.js†L26-L35】

- `initialPrice` is the starting value.
- `volatility` and `drift` are user supplied percentages.
- `change` randomly adds or subtracts volatility.
- The new price is clamped at 0.01 and stored in the `dataPoints` array.

Chart.js renders these points as a line chart that continuously updates while the simulation is running.

## Stock Statistics Endpoint

The API route `/api/stockstats` retrieves recent daily prices for a symbol from Yahoo Finance, computes log returns, and returns the mean (drift) and standard deviation (volatility):

```javascript
const res = await fetch(
  `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d`,
  { headers: { 'User-Agent': 'Mozilla/5.0' } }
);
const json = await res.json();
const prices = json.chart?.result?.[0]?.indicators?.adjclose?.[0]?.adjclose || [];
const returns = [];
for (let i = 1; i < prices.length; i++) {
  const prev = prices[i - 1];
  const curr = prices[i];
  if (prev != null && curr != null && prev > 0) {
    returns.push(Math.log(curr / prev));
  }
}
const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
const drift = mean * 100;
const volatility = Math.sqrt(variance) * 100;
```
【F:app/api/stockstats/route.js†L11-L41】

These values are returned to the client and can pre-fill the simulator inputs.

## User Interface

- **Home Page** – A button that navigates to the simulator:
  ```javascript
  const goToBrownian = () => {
    router.push("/brownian");
  };
  ```
  【F:app/page.js†L7-L9】

- **Layout** – Fonts and global styles are configured in `app/layout.js`:
  ```javascript
  export default function RootLayout({ children }) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    );
  }
  ```
  【F:app/layout.js†L19-L28】

- **Simulation Controls** – Users can adjust initial price, volatility, drift, and the number of points displayed. When running, the graph updates every two seconds.

## License

This example project is provided for educational purposes.
