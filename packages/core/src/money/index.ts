import { AppError, ERROR_CODES } from '../errors.ts';

export type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };

export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export function currency(code: string): CurrencyCode {
  const upper = code.toUpperCase();
  if (!CURRENCY_PATTERN.test(upper) || !Intl.supportedValuesOf('currency').includes(upper)) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, `Unknown currency: ${code}`);
  }
  return upper as CurrencyCode;
}

export function minorUnits(code: CurrencyCode): number {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

export function money(amountMinor: number, code: CurrencyCode | string): Money {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Amount must be an integer in minor units');
  }
  return { amountMinor, currency: typeof code === 'string' ? currency(code) : code };
}

export function fromMajor(major: string, code: CurrencyCode | string): Money {
  const cur = typeof code === 'string' ? currency(code) : code;
  const digits = minorUnits(cur);
  const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(major.trim());
  if (!match) throw new AppError(ERROR_CODES.VALIDATION_FAILED, `Invalid amount: ${major}`);
  const [, sign, whole = '0', fraction = ''] = match;
  if (fraction.length > digits) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, `Too many decimals for ${cur}`);
  }
  const minor = Number(whole + fraction.padEnd(digits, '0'));
  return money(sign ? -minor : minor, cur);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      `Currency mismatch: ${a.currency} vs ${b.currency}`,
    );
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function multiply(a: Money, factor: number): Money {
  if (!Number.isInteger(factor)) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Use allocate() for fractional splits');
  }
  return money(a.amountMinor * factor, a.currency);
}

export function allocate(total: Money, ratios: readonly number[]): Money[] {
  if (ratios.length === 0 || ratios.some((ratio) => ratio < 0 || !Number.isFinite(ratio))) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Ratios must be non-negative numbers');
  }
  const sum = ratios.reduce((acc, ratio) => acc + ratio, 0);
  if (sum === 0) throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Ratios must not all be zero');

  const shares = ratios.map((ratio) => Math.floor((total.amountMinor * ratio) / sum));
  let remainder = total.amountMinor - shares.reduce((acc, share) => acc + share, 0);
  const order = ratios
    .map((ratio, index) => ({ index, fraction: ((total.amountMinor * ratio) / sum) % 1 }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (const { index } of order) {
    if (remainder <= 0) break;
    shares[index] = (shares[index] ?? 0) + 1;
    remainder -= 1;
  }
  return shares.map((share) => money(share, total.currency));
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  return a.amountMinor === b.amountMinor ? 0 : a.amountMinor < b.amountMinor ? -1 : 1;
}

export function isZero(a: Money): boolean {
  return a.amountMinor === 0;
}

export function toMajor(a: Money): number {
  return a.amountMinor / 10 ** minorUnits(a.currency);
}

export function formatMoney(a: Money, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: a.currency }).format(
    toMajor(a),
  );
}
