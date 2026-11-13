// Enter-only page fade (opacity + 6px, 200ms). Routes are keyed by pathname in
// App.tsx, so each navigation remounts this and replays the animation.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="animate-[page-in_200ms_var(--ease-out)_both]">{children}</div>
}
