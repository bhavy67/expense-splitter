import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge our custom theme keys. Without this it reads
// `text-title` as a text colour and drops it when `text-fg` is also present.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'title-lg', 'title', 'body', 'body-sm', 'caption'],
      shadow: ['float'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// YYYY-MM-DD in the user's local timezone (toISOString() is UTC — the wrong
// day between midnight and 05:30 in India).
export function today(): string {
  return new Date().toLocaleDateString('en-CA')
}

// Routes where BottomNav is not rendered (AppShell zeroes --bottom-nav-h there).
export function hidesBottomNav(pathname: string): boolean {
  return pathname.includes('/expenses/new')
}
