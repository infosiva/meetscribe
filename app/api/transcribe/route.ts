/**
 * POST /api/transcribe
 * Accepts: FormData with audio file (webm/mp3/wav, max 25MB)
 * Returns: { transcript: string }
 *
 * Uses Groq Whisper (fastest, free). Falls back to mock if no key.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('audio') as File | null

  if (!file) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

  const GROQ_KEY = process.env.GROQ_API_KEY

  // If no Groq key — return mock transcript for demo
  if (!GROQ_KEY) {
    return NextResponse.json({
      transcript: `Hi, this is Sarah from Bright Homes. I'm calling about the 3-bedroom property at 42 Oak Street. The vendor is happy to accept 485,000 if the buyer can complete within 6 weeks. The buyer mentioned they need a mortgage survey done first — can we schedule that for next Tuesday? Also the vendor wants to include the fitted wardrobes but not the garden furniture. Let me know if you have any questions.`,
      mock: true,
    })
  }

  try {
    const groqForm = new FormData()
    groqForm.append('file', file, file.name || 'audio.webm')
    groqForm.append('model', 'whisper-large-v3-turbo')
    groqForm.append('response_format', 'json')
    groqForm.append('language', 'en')

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_KEY}` },
      body: groqForm,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[transcribe]', err)
      return NextResponse.json({ error: 'Transcription failed' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({ transcript: data.text ?? '' })

  } catch (e: any) {
    console.error('[transcribe]', e.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
