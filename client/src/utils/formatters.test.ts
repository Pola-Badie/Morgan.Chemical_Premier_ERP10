// Tests for currency and number formatting utilities
import { formatCurrency, formatPercentage, formatNumber, parseCurrency } from './formatters';

describe('Currency Formatter', () => {
  test('formats USD currency correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  test('handles negative amounts', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  test('formats different currencies', () => {
    expect(formatCurrency(1234.56, 'EUR', 'en-US')).toBe('€1,234.56');
  });
});

describe('Percentage Formatter', () => {
  test('formats percentages correctly', () => {
    expect(formatPercentage(0.2595)).toBe('25.95%');
    expect(formatPercentage(1.0)).toBe('100.00%');
    expect(formatPercentage(0)).toBe('0.00%');
  });
});

describe('Currency Parser', () => {
  test('parses currency strings correctly', () => {
    expect(parseCurrency('$1,234.56')).toBe(1234.56);
    expect(parseCurrency('€1,234.56')).toBe(1234.56);
    expect(parseCurrency('1234.56')).toBe(1234.56);
    expect(parseCurrency('invalid')).toBe(0);
  });
});