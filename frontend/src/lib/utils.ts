import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// YYYY-MM-DD in the user's local timezone (toISOString() is UTC — the wrong
// day between midnight and 05:30 in India).
export function today(): string {
  return new Date().toLocaleDateString('en-CA')
}
