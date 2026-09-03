import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers as Indian Rupee (₹)
 */
export function formatCurrency(amount: number | string | DecimalLike | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  const numericVal = typeof amount === 'object' && 'toNumber' in amount ? amount.toNumber() : Number(amount);
  if (isNaN(numericVal)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(numericVal);
}

/**
 * Format currency with privacy masking support
 */
export function formatMaskedPrice(
  amount: number | string | DecimalLike | null | undefined,
  isPrivacyMode: boolean
): string {
  if (isPrivacyMode) {
    return '₹••••';
  }
  return formatCurrency(amount);
}

interface DecimalLike {
  toNumber(): number;
}

/**
 * Calculate profit: sellingPrice - costPrice (returns 0 if selling price is not set)
 */
export function calculateProfit(sellingPrice: number, costPrice: number): number {
  if (!sellingPrice || sellingPrice <= 0) return 0;
  return Number((sellingPrice - costPrice).toFixed(2));
}

/**
 * Format profit as a compact number (no ₹ symbol) — e.g. +248 or +1,234
 * Used in tight badge spaces where the ₹ symbol causes overflow.
 */
export function formatProfit(profit: number | string | null | undefined): string {
  if (profit === null || profit === undefined) return '+0';
  const val = Number(profit);
  if (isNaN(val) || val <= 0) return '+0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.abs(val));
}

/**
 * Calculate Markup percentage: ((sellingPrice - costPrice) / costPrice) * 100
 */
export function calculateMarkupPercent(sellingPrice: number, costPrice: number): number {
  if (!sellingPrice || sellingPrice <= 0 || !costPrice || costPrice <= 0) return 0;
  const markup = ((sellingPrice - costPrice) / costPrice) * 100;
  return Number(markup.toFixed(1));
}

/**
 * Format date for human readability
 */
export function formatDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format datetime for human readability (e.g. 27 Aug 2026, 10:35 AM)
 */
export function formatDateTime(dateInput: Date | string): string {
  const date = new Date(dateInput);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Intelligent fuzzy dimension & product smart search matching
 * e.g. "283050" or "28 30 50" matches "L.B. BUSH 28x30x50"
 */
export function matchSmartSearch(text: string | null | undefined, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!text) return false;

  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();

  // 1. Exact or Substring match
  if (t.includes(q)) return true;

  // 2. Normalized dimension alphanumeric match (strips spaces, 'x', '*', '.', '-', '/', '"')
  const cleanQ = q.replace(/[\s\.\-_x\*\/\\\"\'\,]/g, '');
  const cleanT = t.replace(/[\s\.\-_x\*\/\\\"\'\,]/g, '');

  if (cleanQ.length >= 2 && cleanT.includes(cleanQ)) {
    return true;
  }

  // 3. Multi-token match (all words/numbers in query must match)
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allMatch = tokens.every((tok) => {
      const cleanTok = tok.replace(/[\s\.\-_x\*\/\\\"\'\,]/g, '');
      return t.includes(tok) || (cleanTok.length >= 2 && cleanT.includes(cleanTok));
    });
    if (allMatch) return true;
  }

  return false;
}

