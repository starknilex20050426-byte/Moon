import { Currency, Product } from '../types';

export const CURRENCY_CONFIG = {
  LKR: {
    symbol: 'LKR',
    prefix: 'LKR ',
    name: 'Sri Lankan Rupee',
    flag: '🇱🇰',
    freeShippingThreshold: 45000,
    standardShippingFee: 650,
    expressShippingFee: 1200,
  },
  USD: {
    symbol: '$',
    prefix: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    freeShippingThreshold: 150,
    standardShippingFee: 15,
    expressShippingFee: 22,
  },
};

export function formatPrice(amount: number, currency: Currency): string {
  if (currency === 'LKR') {
    return `LKR ${Math.round(amount).toLocaleString('en-US')}`;
  }
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getProductPrice(product: Product, currency: Currency): number {
  return currency === 'LKR' ? product.priceLKR : product.priceUSD;
}

export function getProductOriginalPrice(product: Product, currency: Currency): number | undefined {
  return currency === 'LKR' ? product.originalPriceLKR : product.originalPriceUSD;
}
