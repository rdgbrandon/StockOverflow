import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
    const json = await res.json();
    const result = json.chart?.result?.[0];
    const prices = result?.indicators?.adjclose?.[0]?.adjclose || [];
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const prev = prices[i - 1];
      const curr = prices[i];
      if (prev != null && curr != null && prev > 0) {
        returns.push(Math.log(curr / prev));
      }
    }
    if (returns.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient data for symbol' },
        { status: 500 }
      );
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    const drift = mean * 100;
    const volatility = Math.sqrt(variance) * 100;
    const price =
      result?.meta?.regularMarketPrice ??
      (prices.length > 0 ? prices[prices.length - 1] : null);
    return NextResponse.json({ drift, volatility, price });
  } catch (err) {
    return NextResponse.json({ error: 'Error: ' + err.message }, { status: 500 });
  }
}
