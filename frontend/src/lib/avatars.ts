export interface AvatarPreset {
  id: string
  emoji: string
  label: string
  gradient: string  // CSS gradient
  glow: string      // glow color for animation
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'avatar:0',
    emoji: '🦊',
    label: 'Fox',
    gradient: 'linear-gradient(135deg, #f97316, #fb923c, #fbbf24)',
    glow: 'rgba(249,115,22,0.5)',
  },
  {
    id: 'avatar:1',
    emoji: '🌊',
    label: 'Wave',
    gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8, #7dd3fc)',
    glow: 'rgba(14,165,233,0.5)',
  },
  {
    id: 'avatar:2',
    emoji: '🌸',
    label: 'Blossom',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6, #fbcfe8)',
    glow: 'rgba(236,72,153,0.5)',
  },
  {
    id: 'avatar:3',
    emoji: '⚡',
    label: 'Spark',
    gradient: 'linear-gradient(135deg, #eab308, #facc15, #fef08a)',
    glow: 'rgba(234,179,8,0.5)',
  },
  {
    id: 'avatar:4',
    emoji: '🌿',
    label: 'Forest',
    gradient: 'linear-gradient(135deg, #16a34a, #22c55e, #86efac)',
    glow: 'rgba(22,163,74,0.5)',
  },
  {
    id: 'avatar:5',
    emoji: '🔮',
    label: 'Mystic',
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa, #c4b5fd)',
    glow: 'rgba(124,58,237,0.5)',
  },
  {
    id: 'avatar:6',
    emoji: '🔥',
    label: 'Flame',
    gradient: 'linear-gradient(135deg, #dc2626, #f97316, #fbbf24)',
    glow: 'rgba(220,38,38,0.5)',
  },
  {
    id: 'avatar:7',
    emoji: '❄️',
    label: 'Frost',
    gradient: 'linear-gradient(135deg, #06b6d4, #67e8f9, #a5f3fc)',
    glow: 'rgba(6,182,212,0.5)',
  },
  {
    id: 'avatar:8',
    emoji: '🌙',
    label: 'Lunar',
    gradient: 'linear-gradient(135deg, #4338ca, #6366f1, #a5b4fc)',
    glow: 'rgba(67,56,202,0.5)',
  },
  {
    id: 'avatar:9',
    emoji: '⭐',
    label: 'Cosmic',
    gradient: 'linear-gradient(135deg, #b45309, #d97706, #fcd34d)',
    glow: 'rgba(180,83,9,0.5)',
  },
]

export function getPreset(avatarUrl: string | null | undefined): AvatarPreset | null {
  if (!avatarUrl?.startsWith('avatar:')) return null
  return AVATAR_PRESETS.find((p) => p.id === avatarUrl) ?? null
}

export function defaultAvatarForEmail(email: string): string {
  let hash = 0
  for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_PRESETS[Math.abs(hash) % AVATAR_PRESETS.length].id
}
