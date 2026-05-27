export const runtime = 'edge'
export const revalidate = 3600

export async function GET() {
  try {
    const res = await fetch('http://31.97.56.148:3099/api/stats?site=meetscribe.vercel.app', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return Response.json({ visitors: null }, { status: 200 })
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ visitors: null }, { status: 200 })
  }
}
