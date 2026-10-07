export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--theme-primary)" />
        <rect x="12.5" y="6" width="7" height="12" rx="3.5" fill="#fff" />
        <path d="M8 15a8 8 0 0016 0M16 23v3M12 26h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      <span className="font-semibold tracking-tight text-[15px]" style={{ color: 'var(--foreground)' }}>
        Meet<span style={{ color: 'var(--theme-primary)' }}>Scribe</span>
      </span>
    </span>
  )
}
