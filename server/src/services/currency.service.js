import axios from 'axios';

let rateCache = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getRates(baseCurrency) {
  const now = Date.now();
  const cacheKey = baseCurrency.toUpperCase();

  if (rateCache[cacheKey] && now - cacheTimestamp < CACHE_DURATION) {
    return rateCache[cacheKey];
  }

  try {
    const { data } = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${cacheKey}`
    );
    rateCache[cacheKey] = data.rates;
    cacheTimestamp = now;
    return data.rates;
  } catch (error) {
    console.error('❌ Exchange rate API error:', error.message);
    console.warn(`⚠️  Using fallback 1:1 exchange rate for ${baseCurrency}. Currency conversion may be inaccurate.`);
    // Return fallback 1:1 if API fails - THIS IS A FALLBACK AND MAY CAUSE FINANCIAL INACCURACY
    return { [cacheKey]: 1 };
  }
}

export async function convert(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;

  const rates = await getRates(fromCurrency);
  const rate = rates[toCurrency.toUpperCase()];

  if (!rate) {
    console.error(`❌ No rate found for ${toCurrency} from ${fromCurrency}`);
    console.warn(`⚠️  Using 1:1 fallback. Currency conversion will be inaccurate.`);
    return amount; // fallback - THIS IS NOT ACCURATE
  }

  return Math.round(amount * rate * 100) / 100;
}
