import {
  BedDouble, Clapperboard, House, Package, Pill, Plane, Shapes, ShoppingBag, Users, UtensilsCrossed, Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ExpenseCategory, GroupType } from '@/types'

// Monochrome replacements for the category / group-type emojis (wired up in Phase 2).
export const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  food: UtensilsCrossed,
  travel: Plane,
  accommodation: BedDouble,
  utilities: Zap,
  entertainment: Clapperboard,
  shopping: ShoppingBag,
  medical: Pill,
  other: Package,
}

export const GROUP_TYPE_ICONS: Record<GroupType, LucideIcon> = {
  travel: Plane,
  roommates: House,
  friends: Users,
  dinner: UtensilsCrossed,
  other: Shapes,
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food', travel: 'Travel', accommodation: 'Stay', utilities: 'Bills',
  entertainment: 'Fun', shopping: 'Shopping', medical: 'Medical', other: 'Other',
}

