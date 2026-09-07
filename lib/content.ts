import { get } from '@vercel/edge-config'
import { unstable_cache } from 'next/cache'

const SITE_ID = 'meetscribe'

interface ContentOverrides {
  headline?: string
  subheadline?: string
  cta?: string
  tagline?: string
}

const fetchContentOverrides = unstable_cache(
  async (): Promise<ContentOverrides> => {
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
      return data
    } catch {
      return {}
    }
  },
  [`content-overrides-${SITE_ID}`],
  { revalidate: 600 }
)

export async function getContentOverrides(): Promise<ContentOverrides> {
  return fetchContentOverrides()
}

export type { ContentOverrides }
