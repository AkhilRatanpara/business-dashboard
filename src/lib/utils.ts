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

interface DecimalLike {
  toNumber(): number;
}

/**
 * Calculate profit: sellingPrice - costPrice
 */
export function calculateProfit(sellingPrice: number, costPrice: number): number {
  return Number((sellingPrice - costPrice).toFixed(2));
}

/**
 * Format profit as a compact number (no ₹ symbol) — e.g. +248 or +1,234
 * Used in tight badge spaces where the ₹ symbol causes overflow.
 */
export function formatProfit(profit: number | string | null | undefined): string {
  if (profit === null || profit === undefined) return '+0';
  const val = Number(profit);
  if (isNaN(val)) return '+0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.abs(val));
}

/**
 * Calculate Markup percentage: ((sellingPrice - costPrice) / costPrice) * 100
 */
export function calculateMarkupPercent(sellingPrice: number, costPrice: number): number {
  if (!costPrice || costPrice === 0) return 0;
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
