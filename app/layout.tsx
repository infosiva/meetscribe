import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import SharedNavbar from '@/components/SharedNavbar'
import SharedFooter from '@/components/SharedFooter'
import DesignEffects from '@/components/DesignEffects'
import type { BrandConfig } from '@/components/SharedNavbar'
import FloatingChatWrapper from '@/components/FloatingChatWrapper'
import BackToTop from '@/components/BackToTop'

const brand: BrandConfig = {
  name: 'MeetScribe',
  tagline: 'Meeting done. Notes ready instantly — no Zoom lock-in, no complex setup.',
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
  metadataBase: new URL('https://meetscribe.vercel.app'),
  openGraph: {
    title: 'MeetScribe — AI Meeting Notes for Estate Agents',
    description: 'AI transcribes your calls and drafts follow-up emails instantly.',
    type: 'website', locale: 'en_GB', siteName: 'MeetScribe',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
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
      
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --theme-primary: #6366f1;
            --theme-secondary: #8b5cf6;
            --theme-base: #08071a;
            --background: #08071a;
            --surface-1: #100f28;
            --surface-2: #18163a;
            --foreground: #eef2ff;
            --text-2: #a5b4fc;
            --border-default: rgba(99,102,241,0.15);
            --border-strong: rgba(99,102,241,0.3);
          }
          body { font-family: 'Inter', system-ui, sans-serif !important; }
          h1, h2, h3 { font-family: 'Lora', serif !important; }
          .glass { background: rgba(8,7,26,0.7) !important; border-color: rgba(99,102,241,0.12) !important; }
        ` }} />
      </head>
      <body className="flex flex-col min-h-screen">
        <div className="aurora aurora-primary" aria-hidden />
        <div className="aurora aurora-secondary" aria-hidden />
        <div className="aurora aurora-third" aria-hidden />
        <div className="grain" aria-hidden />
        <DesignEffects />
        <SharedNavbar brand={brand} />
        <main className="flex-1 pt-16">{children}</main>
        <SharedFooter brand={brand} />
        <FloatingChatWrapper />
        <BackToTop accentColor="#6366f1" />
        <Script defer data-site="meetscribe.vercel.app" src="http://31.97.56.148:3098/t.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
