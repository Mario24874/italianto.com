import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(
  date: string | Date,
  locale = 'es-ES',
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  const now = new Date()
  const target = new Date(date)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.round(diffMs / (1000 * 60))

  if (Math.abs(diffDays) >= 30) {
    const diffMonths = Math.round(diffDays / 30)
    return rtf.format(diffMonths, 'month')
  }
  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, 'day')
  if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, 'hour')
  return rtf.format(diffMinutes, 'minute')
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function generateCouponCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export function calcMRR(subscriptions: { amount: number; interval: string }[]): number {
  return subscriptions.reduce((total, sub) => {
    const monthly = sub.interval === 'year' ? sub.amount / 12 : sub.amount
    return total + monthly
  }, 0)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}
