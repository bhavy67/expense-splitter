// Persisted on every member (member.color). The monochrome UI ignores it for now;
// see docs/DESIGN.md. Allowlisted hex: this is user data, not styling.
export const MEMBER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#14b8a6', '#a855f7',
]

export const GROUP_TYPE_LABELS = {
  travel: 'Trip', roommates: 'Home', friends: 'Friends', dinner: 'Dinner', other: 'Other',
} as const
