export type Country = 'United States' | 'Canada' | 'Mexico' | 'United Kingdom' | 'Other';

interface CurrencyInfo {
  code: string;
  symbol: string;
  locale: string;
}

const currencyMap: Record<Country, CurrencyInfo> = {
  'United States': {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
  },
  'Canada': {
    code: 'CAD',
    symbol: 'C$',
    locale: 'en-CA',
  },
  'Mexico': {
    code: 'MXN',
    symbol: 'MX$',
    locale: 'es-MX',
  },
  'United Kingdom': {
    code: 'GBP',
    symbol: '£',
    locale: 'en-GB',
  },
  'Other': {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
  },
};

export function formatCurrency(
  amount: number,
  country: Country | null | undefined,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  const currencyInfo = currencyMap[country || 'United States'];

  const maxFractionDigits = options.maximumFractionDigits ?? 2;
  const minFractionDigits = options.minimumFractionDigits ?? Math.min(2, maxFractionDigits);

  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyInfo.code,
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  };

  return new Intl.NumberFormat(currencyInfo.locale, formatOptions).format(amount);
}

export function getCurrencySymbol(country: Country | null | undefined): string {
  const currencyInfo = currencyMap[country || 'United States'];
  return currencyInfo.symbol;
}
