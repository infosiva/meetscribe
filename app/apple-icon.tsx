import { ImageResponse } from 'next/og'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: '#c93d82', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="110" height="110" viewBox="0 0 32 32" fill="none">
          <rect x="12.5" y="6" width="7" height="12" rx="3.5" fill="#fff" />
          <path d="M8 15a8 8 0 0016 0M16 23v3M12 26h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
