import { describe, expect, it } from 'vitest';
import { AppError } from '../errors.ts';
import {
  add,
  allocate,
  compare,
  currency,
  formatMoney,
  fromMajor,
  isZero,
  minorUnits,
  money,
  multiply,
  subtract,
  toMajor,
} from './index.ts';

const nbsp = /\u00a0|\u202f/g;
const clean = (value: string) => value.replace(nbsp, ' ');

describe('currency', () => {
  it('normalises valid ISO 4217 codes', () => {
    expect(currency('eur')).toBe('EUR');
  });

  it.each(['EURO', 'XYZ', '', '12A'])('rejects %s', (code) => {
    expect(() => currency(code)).toThrow(AppError);
  });

  it.each([
    ['EUR', 2],
    ['JPY', 0],
    ['KWD', 3],
  ])('knows minor units of %s', (code, digits) => {
    expect(minorUnits(currency(code))).toBe(digits);
  });
});

describe('money', () => {
  it('rejects non-integer minor amounts', () => {
    expect(() => money(10.5, 'EUR')).toThrow(AppError);
  });

  it.each([
    ['12.34', 'EUR', 1234],
    ['12', 'EUR', 1200],
    ['12.3', 'EUR', 1230],
    ['-0.05', 'EUR', -5],
    ['1500', 'JPY', 1500],
    ['1.234', 'KWD', 1234],
  ])('parses %s %s', (major, code, minor) => {
    expect(fromMajor(major, code).amountMinor).toBe(minor);
  });

  it.each([
    ['12.345', 'EUR'],
    ['1.5', 'JPY'],
    ['abc', 'EUR'],
    ['1,50', 'EUR'],
  ])('rejects %s %s', (major, code) => {
    expect(() => fromMajor(major, code)).toThrow(AppError);
  });
});

describe('arithmetic', () => {
  const ten = money(1000, 'EUR');
  const three = money(300, 'EUR');

  it('adds, subtracts and multiplies', () => {
    expect(add(ten, three).amountMinor).toBe(1300);
    expect(subtract(three, ten).amountMinor).toBe(-700);
    expect(multiply(three, 3).amountMinor).toBe(900);
  });

  it('refuses mixed currencies', () => {
    expect(() => add(ten, money(100, 'USD'))).toThrow(/Currency mismatch/);
  });

  it('refuses fractional multiplication', () => {
    expect(() => multiply(ten, 1.5)).toThrow(AppError);
  });

  it('compares and detects zero', () => {
    expect(compare(ten, three)).toBe(1);
    expect(compare(three, ten)).toBe(-1);
    expect(compare(ten, ten)).toBe(0);
    expect(isZero(money(0, 'EUR'))).toBe(true);
  });
});

describe('allocate', () => {
  it('splits without losing a cent', () => {
    const parts = allocate(money(1000, 'EUR'), [1, 1, 1]);
    expect(parts.map((part) => part.amountMinor)).toEqual([334, 333, 333]);
  });

  it('respects ratios', () => {
    const parts = allocate(money(100, 'EUR'), [70, 30]);
    expect(parts.map((part) => part.amountMinor)).toEqual([70, 30]);
  });

  it('always sums to the total', () => {
    for (let total = 0; total < 500; total += 7) {
      const parts = allocate(money(total, 'EUR'), [3, 5, 11, 1]);
      expect(parts.reduce((sum, part) => sum + part.amountMinor, 0)).toBe(total);
    }
  });

  it.each([[[]], [[0, 0]], [[-1, 2]], [[Number.NaN]]])('rejects ratios %j', (ratios) => {
    expect(() => allocate(money(100, 'EUR'), ratios)).toThrow(AppError);
  });
});

describe('formatting', () => {
  it('formats per locale and currency', () => {
    expect(clean(formatMoney(money(123456, 'EUR'), 'fr-BE'))).toBe('1 234,56 €');
    expect(formatMoney(money(123456, 'EUR'), 'en-IE')).toBe('€1,234.56');
    expect(clean(formatMoney(money(1500, 'JPY'), 'en-US'))).toBe('¥1,500');
    expect(toMajor(money(1234, 'KWD'))).toBe(1.234);
  });
});
