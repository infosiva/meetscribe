import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #0e7490, #22d3ee)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* microphone capsule + stand */}
          <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
          <path d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
