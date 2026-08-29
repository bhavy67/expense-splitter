// Hand-crafted SVG avatar illustrations — one per character

export function WolfSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Ears */}
      <polygon points="8,18 13,4 18,18" fill="#64748b"/>
      <polygon points="22,18 27,4 32,18" fill="#64748b"/>
      <polygon points="10,17 13,7 16,17" fill="#c084fc" opacity="0.7"/>
      <polygon points="24,17 27,7 30,17" fill="#c084fc" opacity="0.7"/>
      {/* Head */}
      <ellipse cx="20" cy="24" rx="12" ry="11" fill="#94a3b8"/>
      {/* Face shading */}
      <ellipse cx="20" cy="26" rx="7" ry="6" fill="#cbd5e1"/>
      {/* Eyes */}
      <ellipse cx="15.5" cy="22" rx="2.5" ry="2.8" fill="#fbbf24"/>
      <ellipse cx="24.5" cy="22" rx="2.5" ry="2.8" fill="#fbbf24"/>
      <ellipse cx="15.5" cy="22.2" rx="1" ry="2.2" fill="#1e293b"/>
      <ellipse cx="24.5" cy="22.2" rx="1" ry="2.2" fill="#1e293b"/>
      <circle cx="16" cy="21.5" r="0.5" fill="white" opacity="0.8"/>
      <circle cx="25" cy="21.5" r="0.5" fill="white" opacity="0.8"/>
      {/* Nose */}
      <ellipse cx="20" cy="27.5" rx="2" ry="1.2" fill="#475569"/>
      {/* Mouth */}
      <path d="M18 29.5 Q20 31.5 22 29.5" stroke="#475569" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function FoxSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Ears */}
      <polygon points="7,20 13,2 19,20" fill="#ea580c"/>
      <polygon points="21,20 27,2 33,20" fill="#ea580c"/>
      <polygon points="10,19 13,7 16,19" fill="#fef3c7"/>
      <polygon points="24,19 27,7 30,19" fill="#fef3c7"/>
      {/* Head */}
      <ellipse cx="20" cy="25" rx="12" ry="10" fill="#f97316"/>
      {/* Cheeks */}
      <ellipse cx="12" cy="26" rx="4" ry="3.5" fill="#fed7aa"/>
      <ellipse cx="28" cy="26" rx="4" ry="3.5" fill="#fed7aa"/>
      {/* Snout */}
      <ellipse cx="20" cy="29" rx="5" ry="3.5" fill="#fed7aa"/>
      {/* Eyes */}
      <ellipse cx="15" cy="23" rx="2.5" ry="2.5" fill="#1c1917"/>
      <ellipse cx="25" cy="23" rx="2.5" ry="2.5" fill="#1c1917"/>
      <circle cx="16" cy="22.2" r="0.8" fill="white" opacity="0.9"/>
      <circle cx="26" cy="22.2" r="0.8" fill="white" opacity="0.9"/>
      {/* Nose */}
      <ellipse cx="20" cy="27.5" rx="1.8" ry="1.2" fill="#1c1917"/>
      {/* Mouth */}
      <path d="M18.5 29 Q20 31 21.5 29" stroke="#7c2d12" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function LionSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Mane rays */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
        <ellipse key={i} cx="20" cy="21" rx="2" ry="6"
          fill={i % 2 === 0 ? '#b45309' : '#d97706'}
          transform={`rotate(${deg} 20 21)`} opacity="0.9"/>
      ))}
      {/* Mane circle */}
      <circle cx="20" cy="21" r="11" fill="#d97706"/>
      {/* Head */}
      <ellipse cx="20" cy="21" rx="9" ry="9" fill="#fbbf24"/>
      {/* Face */}
      <ellipse cx="20" cy="23" rx="6" ry="5" fill="#fde68a"/>
      {/* Eyes */}
      <ellipse cx="15.5" cy="19.5" rx="2.2" ry="2.2" fill="#78350f"/>
      <ellipse cx="24.5" cy="19.5" rx="2.2" ry="2.2" fill="#78350f"/>
      <ellipse cx="15.5" cy="19.5" rx="1" ry="1.8" fill="#1c1917"/>
      <ellipse cx="24.5" cy="19.5" rx="1" ry="1.8" fill="#1c1917"/>
      <circle cx="16" cy="19" r="0.6" fill="white" opacity="0.9"/>
      <circle cx="25" cy="19" r="0.6" fill="white" opacity="0.9"/>
      {/* Nose */}
      <path d="M18 24.5 L20 23 L22 24.5 Q20 26 18 24.5Z" fill="#92400e"/>
      {/* Whisker dots */}
      <circle cx="12.5" cy="25" r="0.5" fill="#92400e" opacity="0.6"/>
      <circle cx="14" cy="26" r="0.5" fill="#92400e" opacity="0.6"/>
      <circle cx="27.5" cy="25" r="0.5" fill="#92400e" opacity="0.6"/>
      <circle cx="26" cy="26" r="0.5" fill="#92400e" opacity="0.6"/>
      {/* Mouth */}
      <path d="M18 26 Q20 28 22 26" stroke="#92400e" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function DragonSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Horns */}
      <path d="M14 16 L11 4 L16 14" fill="#065f46"/>
      <path d="M26 16 L29 4 L24 14" fill="#065f46"/>
      <path d="M14 16 L12 6 L16 14" fill="#34d399" opacity="0.5"/>
      <path d="M26 16 L28 6 L24 14" fill="#34d399" opacity="0.5"/>
      {/* Head */}
      <ellipse cx="20" cy="25" rx="13" ry="10" fill="#047857"/>
      {/* Scale texture */}
      <ellipse cx="15" cy="22" rx="3" ry="2" fill="#065f46" opacity="0.5"/>
      <ellipse cx="25" cy="22" rx="3" ry="2" fill="#065f46" opacity="0.5"/>
      <ellipse cx="20" cy="19" rx="2.5" ry="1.5" fill="#065f46" opacity="0.4"/>
      {/* Snout */}
      <ellipse cx="20" cy="30" rx="5" ry="3" fill="#059669"/>
      {/* Nostrils */}
      <ellipse cx="18" cy="30" rx="0.8" ry="0.6" fill="#022c22"/>
      <ellipse cx="22" cy="30" rx="0.8" ry="0.6" fill="#022c22"/>
      {/* Eyes — slit pupils */}
      <ellipse cx="14.5" cy="23" rx="3" ry="2.5" fill="#fbbf24"/>
      <ellipse cx="25.5" cy="23" rx="3" ry="2.5" fill="#fbbf24"/>
      <ellipse cx="14.5" cy="23" rx="0.9" ry="2.2" fill="#022c22"/>
      <ellipse cx="25.5" cy="23" rx="0.9" ry="2.2" fill="#022c22"/>
      <circle cx="14.8" cy="22.3" r="0.5" fill="white" opacity="0.7"/>
      <circle cx="25.8" cy="22.3" r="0.5" fill="white" opacity="0.7"/>
      {/* Teeth */}
      <path d="M17 32 L18.5 35 L20 32 L21.5 35 L23 32" stroke="#d1fae5" strokeWidth="0.8" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

export function ButterflySVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Upper wings */}
      <ellipse cx="12" cy="18" rx="9" ry="11" fill="#a855f7" opacity="0.9" transform="rotate(-15 12 18)"/>
      <ellipse cx="28" cy="18" rx="9" ry="11" fill="#a855f7" opacity="0.9" transform="rotate(15 28 18)"/>
      {/* Wing patterns */}
      <circle cx="11" cy="16" r="3" fill="#f0abfc" opacity="0.6"/>
      <circle cx="29" cy="16" r="3" fill="#f0abfc" opacity="0.6"/>
      <circle cx="11" cy="16" r="1.5" fill="#7c3aed" opacity="0.7"/>
      <circle cx="29" cy="16" r="1.5" fill="#7c3aed" opacity="0.7"/>
      {/* Lower wings */}
      <ellipse cx="13" cy="29" rx="7" ry="7" fill="#c084fc" opacity="0.85" transform="rotate(20 13 29)"/>
      <ellipse cx="27" cy="29" rx="7" ry="7" fill="#c084fc" opacity="0.85" transform="rotate(-20 27 29)"/>
      <circle cx="13" cy="30" r="2" fill="#f0abfc" opacity="0.5"/>
      <circle cx="27" cy="30" r="2" fill="#f0abfc" opacity="0.5"/>
      {/* Body */}
      <ellipse cx="20" cy="24" rx="2" ry="8" fill="#4c1d95"/>
      {/* Head */}
      <circle cx="20" cy="15" r="3" fill="#4c1d95"/>
      {/* Eyes */}
      <circle cx="18.5" cy="14.5" r="1" fill="#f0abfc"/>
      <circle cx="21.5" cy="14.5" r="1" fill="#f0abfc"/>
      {/* Antennae */}
      <path d="M19 12 Q16 8 14 6" stroke="#7c3aed" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
      <path d="M21 12 Q24 8 26 6" stroke="#7c3aed" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
      <circle cx="14" cy="6" r="1.2" fill="#d946ef"/>
      <circle cx="26" cy="6" r="1.2" fill="#d946ef"/>
    </svg>
  )
}

export function BeeSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Wings */}
      <ellipse cx="12" cy="17" rx="8" ry="5" fill="white" opacity="0.7" transform="rotate(-25 12 17)"/>
      <ellipse cx="28" cy="17" rx="8" ry="5" fill="white" opacity="0.7" transform="rotate(25 28 17)"/>
      {/* Body — stripes */}
      <ellipse cx="20" cy="27" rx="8" ry="10" fill="#fbbf24"/>
      <rect x="12.5" y="22" width="15" height="3.5" rx="1" fill="#1c1917" opacity="0.8"/>
      <rect x="12.5" y="28" width="15" height="3.5" rx="1" fill="#1c1917" opacity="0.8"/>
      <rect x="13.5" y="31.5" width="13" height="2.5" rx="1.2" fill="#1c1917" opacity="0.6"/>
      {/* Head */}
      <circle cx="20" cy="16" r="7" fill="#1c1917"/>
      {/* Fuzz */}
      <circle cx="20" cy="10" r="2.5" fill="#1c1917"/>
      <circle cx="16" cy="11" r="2" fill="#1c1917"/>
      <circle cx="24" cy="11" r="2" fill="#1c1917"/>
      {/* Eyes — compound */}
      <circle cx="15.5" cy="16" r="3.5" fill="#4ade80" opacity="0.9"/>
      <circle cx="24.5" cy="16" r="3.5" fill="#4ade80" opacity="0.9"/>
      <circle cx="15.5" cy="16" r="2" fill="#166534"/>
      <circle cx="24.5" cy="16" r="2" fill="#166534"/>
      <circle cx="16" cy="15.2" r="0.7" fill="white" opacity="0.8"/>
      <circle cx="25" cy="15.2" r="0.7" fill="white" opacity="0.8"/>
      {/* Antennae */}
      <path d="M17 10 Q14 6 12 4" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M23 10 Q26 6 28 4" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="4" r="1.5" fill="#fbbf24"/>
      <circle cx="28" cy="4" r="1.5" fill="#fbbf24"/>
      {/* Stinger */}
      <path d="M20 36 L20 39" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function OctoSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Tentacles */}
      <path d="M10 28 Q6 35 9 39" stroke="#c026d3" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M14 30 Q11 37 13 40" stroke="#c026d3" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M18 31 Q17 38 18 41" stroke="#c026d3" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M22 31 Q23 38 22 41" stroke="#c026d3" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M26 30 Q29 37 27 40" stroke="#c026d3" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M30 28 Q34 35 31 39" stroke="#c026d3" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Body/mantle */}
      <ellipse cx="20" cy="21" rx="13" ry="14" fill="#e879f9"/>
      {/* Mantle dome */}
      <ellipse cx="20" cy="14" rx="10" ry="8" fill="#d946ef"/>
      {/* Spots */}
      <circle cx="14" cy="12" r="2" fill="#a21caf" opacity="0.5"/>
      <circle cx="26" cy="12" r="2" fill="#a21caf" opacity="0.5"/>
      <circle cx="20" cy="10" r="1.5" fill="#a21caf" opacity="0.4"/>
      {/* Eyes */}
      <circle cx="15" cy="21" r="4" fill="white"/>
      <circle cx="25" cy="21" r="4" fill="white"/>
      <circle cx="15" cy="21" r="2.5" fill="#4338ca"/>
      <circle cx="25" cy="21" r="2.5" fill="#4338ca"/>
      <circle cx="15" cy="21" r="1.2" fill="#1e1b4b"/>
      <circle cx="25" cy="21" r="1.2" fill="#1e1b4b"/>
      <circle cx="15.8" cy="20.2" r="0.8" fill="white"/>
      <circle cx="25.8" cy="20.2" r="0.8" fill="white"/>
      {/* Smile */}
      <path d="M16 26.5 Q20 29.5 24 26.5" stroke="#a21caf" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function HawkSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Wing tips visible at sides */}
      <path d="M4 24 Q8 20 12 24" fill="#92400e" opacity="0.7"/>
      <path d="M36 24 Q32 20 28 24" fill="#92400e" opacity="0.7"/>
      {/* Head */}
      <ellipse cx="20" cy="20" rx="13" ry="13" fill="#92400e"/>
      {/* White face mask */}
      <ellipse cx="20" cy="22" rx="9" ry="9" fill="#fef3c7"/>
      {/* Dark crown */}
      <ellipse cx="20" cy="12" rx="9" ry="5" fill="#78350f"/>
      <path d="M12 17 Q20 13 28 17 Q28 10 20 8 Q12 10 12 17Z" fill="#78350f"/>
      {/* Beak */}
      <path d="M17 27 L20 32 L23 27 Q20 25 17 27Z" fill="#fbbf24"/>
      <path d="M20 29.5 L20 32" stroke="#b45309" strokeWidth="0.5"/>
      {/* Eyes */}
      <circle cx="14.5" cy="21" r="4" fill="#fbbf24"/>
      <circle cx="25.5" cy="21" r="4" fill="#fbbf24"/>
      <circle cx="14.5" cy="21" r="2.5" fill="#1c1917"/>
      <circle cx="25.5" cy="21" r="2.5" fill="#1c1917"/>
      <circle cx="15.2" cy="20.2" r="1" fill="white" opacity="0.8"/>
      <circle cx="26.2" cy="20.2" r="1" fill="white" opacity="0.8"/>
      {/* Eye ridge */}
      <path d="M11.5 19 Q14.5 17 17.5 19" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M22.5 19 Q25.5 17 28.5 19" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function MothSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Upper wings */}
      <ellipse cx="11" cy="19" rx="9" ry="12" fill="#c7d2fe" opacity="0.8" transform="rotate(-10 11 19)"/>
      <ellipse cx="29" cy="19" rx="9" ry="12" fill="#c7d2fe" opacity="0.8" transform="rotate(10 29 19)"/>
      {/* Eye spots on upper wings */}
      <circle cx="10" cy="17" r="3.5" fill="#4338ca" opacity="0.6"/>
      <circle cx="30" cy="17" r="3.5" fill="#4338ca" opacity="0.6"/>
      <circle cx="10" cy="17" r="2" fill="#a5b4fc" opacity="0.7"/>
      <circle cx="30" cy="17" r="2" fill="#a5b4fc" opacity="0.7"/>
      <circle cx="10" cy="17" r="0.8" fill="#312e81"/>
      <circle cx="30" cy="17" r="0.8" fill="#312e81"/>
      {/* Lower wings */}
      <ellipse cx="13" cy="31" rx="7" ry="7" fill="#a5b4fc" opacity="0.7" transform="rotate(15 13 31)"/>
      <ellipse cx="27" cy="31" rx="7" ry="7" fill="#a5b4fc" opacity="0.7" transform="rotate(-15 27 31)"/>
      <circle cx="13" cy="32" r="2" fill="#4338ca" opacity="0.4"/>
      <circle cx="27" cy="32" r="2" fill="#4338ca" opacity="0.4"/>
      {/* Body */}
      <ellipse cx="20" cy="26" rx="2.5" ry="9" fill="#312e81"/>
      {/* Fuzzy body segments */}
      <ellipse cx="20" cy="22" rx="3" ry="2" fill="#4338ca"/>
      <ellipse cx="20" cy="26" rx="2.5" ry="2" fill="#4338ca"/>
      <ellipse cx="20" cy="30" rx="2" ry="2" fill="#4338ca"/>
      {/* Head */}
      <circle cx="20" cy="16" r="3.5" fill="#312e81"/>
      {/* Eyes */}
      <circle cx="18.5" cy="15.5" r="1.2" fill="#a5b4fc"/>
      <circle cx="21.5" cy="15.5" r="1.2" fill="#a5b4fc"/>
      <circle cx="18.5" cy="15.5" r="0.5" fill="white"/>
      <circle cx="21.5" cy="15.5" r="0.5" fill="white"/>
      {/* Feathery antennae */}
      <path d="M19 13 Q16 9 13 7" stroke="#a5b4fc" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M16 10 L14 8" stroke="#a5b4fc" strokeWidth="0.6" strokeLinecap="round"/>
      <path d="M17.5 11.5 L15.5 9.5" stroke="#a5b4fc" strokeWidth="0.6" strokeLinecap="round"/>
      <path d="M21 13 Q24 9 27 7" stroke="#a5b4fc" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M24 10 L26 8" stroke="#a5b4fc" strokeWidth="0.6" strokeLinecap="round"/>
      <path d="M22.5 11.5 L24.5 9.5" stroke="#a5b4fc" strokeWidth="0.6" strokeLinecap="round"/>
    </svg>
  )
}

export function DolphinSVG() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Tail fin at bottom */}
      <path d="M13 37 Q20 33 27 37 Q24 31 20 30 Q16 31 13 37Z" fill="#7dd3fc" opacity="0.8"/>
      {/* Body */}
      <ellipse cx="20" cy="24" rx="10" ry="12" fill="#38bdf8"/>
      {/* Belly */}
      <ellipse cx="20" cy="26" rx="6" ry="8" fill="#e0f2fe"/>
      {/* Dorsal fin */}
      <path d="M20 12 Q26 10 24 19" fill="#0284c7" opacity="0.8"/>
      {/* Side fins */}
      <path d="M11 24 Q7 28 10 32 Q12 28 14 27Z" fill="#0284c7" opacity="0.7"/>
      <path d="M29 24 Q33 28 30 32 Q28 28 26 27Z" fill="#0284c7" opacity="0.7"/>
      {/* Head */}
      <ellipse cx="20" cy="17" rx="9" ry="8" fill="#38bdf8"/>
      {/* Snout / beak */}
      <path d="M13 21 Q11 23 14 25 Q16 22 18 21Z" fill="#7dd3fc"/>
      {/* Smile crease */}
      <path d="M13 22 Q14 24 16 23" stroke="#0284c7" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
      {/* Eye */}
      <circle cx="15" cy="18" r="2.5" fill="#0c4a6e"/>
      <circle cx="15" cy="18" r="1.2" fill="#082f49"/>
      <circle cx="15.7" cy="17.3" r="0.7" fill="white" opacity="0.9"/>
      {/* Head shine */}
      <ellipse cx="23" cy="14" rx="3" ry="2" fill="white" opacity="0.2" transform="rotate(-20 23 14)"/>
    </svg>
  )
}

export const AVATAR_SVG_MAP: Record<string, () => JSX.Element> = {
  'avatar:0': WolfSVG,
  'avatar:1': FoxSVG,
  'avatar:2': LionSVG,
  'avatar:3': DragonSVG,
  'avatar:4': ButterflySVG,
  'avatar:5': BeeSVG,
  'avatar:6': OctoSVG,
  'avatar:7': HawkSVG,
  'avatar:8': MothSVG,
  'avatar:9': DolphinSVG,
}
