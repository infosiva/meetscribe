import type { Metadata } from 'next'
import './globals.css'
import SharedNavbar from '@/components/SharedNavbar'
import SharedFooter from '@/components/SharedFooter'
import type { BrandConfig } from '@/components/SharedNavbar'

export const brand: BrandConfig = {
  name: 'MeetScribe',
  tagline: 'AI meeting notes for estate agents — transcribe, summarise, follow up in seconds.',
  icon: '🎙️',
  color: '#6366f1',
  url: 'https://meetscribe.vercel.app',
  navLinks: [
    { label: 'How it works', href: '#how' },
    { label: 'For agents', href: '#agents' },
  ],
  cta: { label: 'Try free →', href: '/' },
}

export const metadata: Metadata = {
  title: 'MeetScribe — AI Meeting Notes for Estate Agents',
  description: 'Record or upload your client calls. AI transcribes, summarises and drafts follow-up emails instantly. Built for UK estate agents.',
  keywords: ['meeting notes', 'AI transcription', 'estate agent tools', 'property CRM', 'meeting summary'],
  openGraph: {
    title: 'MeetScribe — AI Meeting Notes for Estate Agents',
    description: 'AI transcribes your calls and drafts follow-up emails instantly.',
    type: 'website', locale: 'en_GB', siteName: 'MeetScribe',
  },
  twitter: { card: 'summary_large_image', title: 'MeetScribe', description: 'AI meeting notes for estate agents.' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "SoftwareApplication", "name": "MeetScribe", "url": brand.url,
              "description": brand.tagline, "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" }
            },
            { "@type": "WebSite", "name": "MeetScribe", "url": brand.url }
          ]
        })}} />
      </head>
      <body className="flex flex-col min-h-screen">
        <SharedNavbar brand={brand} />
        <main className="flex-1 pt-16">{children}</main>
        <SharedFooter brand={brand} />
      </body>
    </html>
  )
}
