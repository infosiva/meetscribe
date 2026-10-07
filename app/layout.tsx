import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import SharedNavbar from '@/components/SharedNavbar'
import SharedFooter from '@/components/SharedFooter'
import type { BrandConfig } from '@/components/SharedNavbar'
import FloatingChatWrapper from '@/components/FloatingChatWrapper'
import { getSiteFlags } from '@/lib/flags'
import BackToTop from '@/components/BackToTop'
import FeedbackWidget from '@/components/FeedbackWidget'
import { AnimatedBg } from '@/components/AnimatedBg'
import Telemetry from '@/components/Telemetry'
import { loadSiteTheme, buildThemeStyleTag, buildGa4Snippet, isValidGa4Id } from '@/lib/theme-loader'

import { MotionProvider } from "@infosiva/shared-ui/modern";
const brand: BrandConfig = {
  name: 'MeetScribe',
  tagline: 'Meeting done. Notes ready instantly — no Zoom lock-in, no complex setup.',
  icon: '🎙️',
  color: 'var(--theme-primary)',
  url: 'https://meetscribe.app',
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
  metadataBase: new URL('https://meetscribe.app'),
  openGraph: {
    title: 'MeetScribe — AI Meeting Notes for Estate Agents',
    description: 'AI transcribes your calls and drafts follow-up emails instantly.',
    type: 'website', locale: 'en_GB', siteName: 'MeetScribe',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'MeetScribe', description: 'AI meeting notes for estate agents.' },
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const flags = await getSiteFlags('meetscribe')
  const theme = await loadSiteTheme('meetscribe')
  const ga4 = buildGa4Snippet(theme)
  return (
    <html lang="en" data-layout={theme?.layout?.archetype ?? 'career-portfolio'} suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4237294630161176" />
        <Script
                  async
                  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4237294630161176"
                  crossOrigin="anonymous"
                  strategy="afterInteractive"
                />
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
      
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          body { font-family: 'Inter', system-ui, sans-serif; }
          h1, h2, h3 { font-family: 'Lora', serif; }
          ${buildThemeStyleTag(theme, { background: '#fbf7f5', primary: '#c93d82', secondary: '#e0719f' })}
        ` }} />
        {ga4 && <script async src={`https://www.googletagmanager.com/gtag/js?id=${theme?.analytics?.ga4Id}`} />}
        {ga4 && isValidGa4Id(theme?.analytics?.ga4Id) && <script dangerouslySetInnerHTML={{ __html: ga4 }} />}
      </head>
      <body className="flex flex-col min-h-screen">
        <AnimatedBg theme={theme} />
        <div className="grain" aria-hidden />
        <SharedNavbar brand={brand} />
        <main className="flex-1 pt-16"><MotionProvider>{children}</MotionProvider></main>
        <SharedFooter brand={brand} />
        {flags.chatbot && <FloatingChatWrapper />}
        <FeedbackWidget siteName="MeetScribe" position="left" />
        <BackToTop accentColor="var(--theme-primary)" />
        <Telemetry />
      </body>
    </html>
  )
}
