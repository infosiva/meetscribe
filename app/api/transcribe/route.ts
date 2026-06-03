/**
 * POST /api/transcribe
 * Accepts: FormData with audio file (webm/mp3/wav, max 25MB)
 * Returns: { transcript, provider, segments? }
 *
 * STT chain: Groq whisper-large-v3-turbo → VibeVoice-ASR-7B (diarization) → mock
 * VibeVoice-ASR returns speaker-labelled segments for meeting use cases.
 */
import { NextRequest, NextResponse } from 'next/server'
import { stt } from '@/lib/voice'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('audio') as File | null

  if (!file) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

  const hasKeys = process.env.GROQ_API_KEY || process.env.HF_TOKEN
  if (!hasKeys) {
    return NextResponse.json({
      transcript: `Hi, this is Sarah from Bright Homes. I'm calling about the 3-bedroom property at 42 Oak Street. The vendor is happy to accept 485,000 if the buyer can complete within 6 weeks. The buyer mentioned they need a mortgage survey done first — can we schedule that for next Tuesday? Also the vendor wants to include the fitted wardrobes but not the garden furniture. Let me know if you have any questions.`,
      provider: 'mock',
      mock: true,
    })
  }

  try {
    const result = await stt(formData)
    if (!result) {
      return NextResponse.json({ error: 'All STT providers failed' }, { status: 502 })
    }

    return NextResponse.json({
      transcript: result.transcript,
      provider: result.provider,
      // segments present only from VibeVoice-ASR (speaker diarization + timestamps)
      ...(result.segments ? { segments: result.segments } : {}),
    })

  } catch (e: any) {
    console.error('[transcribe]', e.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
