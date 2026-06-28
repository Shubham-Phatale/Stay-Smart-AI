export interface CurrencyConfig {
  code: string;
  symbol: string;
  basePricePerNight: number; // reasonable hostel base price in this currency
}

// Rough lat/lng bounding boxes for currency detection
const REGIONS: { bounds: [number, number, number, number]; config: CurrencyConfig }[] = [
  {
    bounds: [8, 68, 37, 97], // India
    config: { code: "INR", symbol: "₹", basePricePerNight: 700 },
  },
  {
    bounds: [24, -125, 50, -66], // USA
    config: { code: "USD", symbol: "$", basePricePerNight: 35 },
  },
  {
    bounds: [42, -84, 83, -52], // Canada
    config: { code: "CAD", symbol: "CA$", basePricePerNight: 40 },
  },
  {
    bounds: [-44, 112, -10, 154], // Australia
    config: { code: "AUD", symbol: "A$", basePricePerNight: 45 },
  },
  {
    bounds: [36, -10, 71, 32], // Europe
    config: { code: "EUR", symbol: "€", basePricePerNight: 30 },
  },
  {
    bounds: [49, -8, 61, 2], // UK
    config: { code: "GBP", symbol: "£", basePricePerNight: 28 },
  },
];

const DEFAULT: CurrencyConfig = { code: "USD", symbol: "$", basePricePerNight: 35 };

export function detectCurrency(lat: number, lng: number): CurrencyConfig {
  for (const { bounds, config } of REGIONS) {
    const [minLat, minLng, maxLat, maxLng] = bounds;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return config;
    }
  }
  return DEFAULT;
}

export function formatPrice(amount: number, currency: CurrencyConfig): string {
  return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
}
