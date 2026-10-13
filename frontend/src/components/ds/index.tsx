// No-Smoke Alert design system — extracted from the top page (/).
// New pages should build from these pieces instead of raw Tailwind classes.
// Rules in Japanese: see docs/design-rules.md.
import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const ds = {
  pageBg: 'min-h-screen bg-gradient-to-br from-blue-50 to-green-50',
  header: 'bg-white shadow-sm border-b',
  brandText: 'text-[#0F2346]',
  panel: 'rounded-lg border bg-white shadow-sm',
  panelPad: 'p-5',
  h1: 'text-2xl font-bold tracking-normal text-gray-900 sm:text-3xl',
  h2: 'text-lg font-semibold text-gray-900',
  h3: 'font-medium text-gray-900',
  body: 'text-sm leading-6 text-gray-600',
  small: 'text-xs text-gray-500',
  eyebrow: 'text-sm font-medium text-blue-700',
  link: 'text-blue-700 underline',
  iconChip: 'rounded-lg p-2',
  primary:
    'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-shadow hover:bg-blue-700 hover:shadow-md',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:shadow-md',
  // Icons: gray/blue only (same as the top page's icon chip). No red/orange for report types.
  iconChipTone: 'bg-blue-100 text-blue-600',
  notice: {
    info: 'rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900',
    error: 'rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800',
    success: 'rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800',
  },
} as const;

export function Panel({ className, as: As = 'section', ...p }: React.HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'nav' }) {
  return <As className={cn(ds.panel, ds.panelPad, className)} {...p} />;
}

export function Notice({ tone = 'info', className, ...p }: React.HTMLAttributes<HTMLDivElement> & { tone?: keyof typeof ds.notice }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cn(ds.notice[tone], className)} {...p} />;
}

export function PrimaryLink({ className, ...p }: React.ComponentProps<typeof Link>) {
  return <Link className={cn(ds.primary, className)} {...p} />;
}
