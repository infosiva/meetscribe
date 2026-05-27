import { get } from '@vercel/edge-config'

const SITE_ID = 'meetscribe'
const TTL = 60_000

interface ContentOverrides {
  headline?: string
  subheadline?: string
  cta?: string
  tagline?: string
}

let cache: { data: ContentOverrides; ts: number } | null = null

export async function getContentOverrides(): Promise<ContentOverrides> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data

  try {
    const [headline, subheadline, cta, tagline] = await Promise.all([
      get<string>(`content_${SITE_ID}_headline`),
      get<string>(`content_${SITE_ID}_subheadline`),
      get<string>(`content_${SITE_ID}_cta`),
      get<string>(`content_${SITE_ID}_tagline`),
    ])
    const data: ContentOverrides = {}
    if (headline) data.headline = headline
    if (subheadline) data.subheadline = subheadline
    if (cta) data.cta = cta
    if (tagline) data.tagline = tagline
    cache = { data, ts: Date.now() }
    return data
  } catch {
    return {}
  }
}

export type { ContentOverrides }
