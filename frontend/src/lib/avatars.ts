export interface AvatarPreset {
  id: string
  label: string
  gradient: string
  glow: string
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'avatar:0', label: 'Wolf',      gradient: 'linear-gradient(135deg, #334155, #0f172a)', glow: 'rgba(245,158,11,0.5)' },
  { id: 'avatar:1', label: 'Fox',       gradient: 'linear-gradient(135deg, #c2410c, #7c2d12)', glow: 'rgba(251,146,60,0.5)' },
  { id: 'avatar:2', label: 'Lion',      gradient: 'linear-gradient(135deg, #d97706, #7c2d12)', glow: 'rgba(251,191,36,0.5)' },
  { id: 'avatar:3', label: 'Dragon',    gradient: 'linear-gradient(135deg, #047857, #022c22)', glow: 'rgba(251,191,36,0.4)' },
  { id: 'avatar:4', label: 'Butterfly', gradient: 'linear-gradient(135deg, #7c3aed, #4c1d95)', glow: 'rgba(240,171,252,0.5)' },
  { id: 'avatar:5', label: 'Bee',       gradient: 'linear-gradient(135deg, #b45309, #78350f)', glow: 'rgba(250,204,21,0.5)' },
  { id: 'avatar:6', label: 'Octopus',   gradient: 'linear-gradient(135deg, #0e7490, #083344)', glow: 'rgba(232,121,249,0.5)' },
  { id: 'avatar:7', label: 'Hawk',      gradient: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)', glow: 'rgba(251,191,36,0.5)' },
  { id: 'avatar:8', label: 'Moth',      gradient: 'linear-gradient(135deg, #1e1b4b, #09090b)', glow: 'rgba(165,180,252,0.5)' },
  { id: 'avatar:9', label: 'Dolphin',   gradient: 'linear-gradient(135deg, #0891b2, #164e63)', glow: 'rgba(125,211,252,0.5)' },
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
