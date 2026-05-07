import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MeetScribe — AI Meeting Notes for Estate Agents',
  description: 'Turn your client calls into structured notes, action items and follow-up emails instantly.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
