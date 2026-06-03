/**
 * lib/voice.ts — Universal Voice layer (canonical template)
 *
 * TTS chain (dynamically ordered via VOICE_TTS_ORDER env var):
 *   Default order: elevenlabs → vibevoice → google
 *   Override: VOICE_TTS_ORDER=vibevoice,elevenlabs,google
 *   Each provider is skipped silently if its key is missing.
 *   Returns null → caller falls back to browser SpeechSynthesis.
 *
 * STT chain (dynamically ordered via VOICE_STT_ORDER env var):
 *   Default order: groq → vibevoice-asr
 *   Override: VOICE_STT_ORDER=vibevoice-asr,groq
 *   Returns null → caller shows manual transcript input.
 *
 * Env vars (all optional — chain skips missing providers):
 *   VOICE_TTS_ORDER          comma list: elevenlabs,vibevoice,google
 *   VOICE_STT_ORDER          comma list: groq,vibevoice-asr
 *   ELEVENLABS_API_KEY       ElevenLabs TTS
 *   ELEVENLABS_VOICE_ID      Voice ID (default: Adam — pNInz6obpgDQGcFmaJgB)
 *   HF_TOKEN                 HuggingFace token (free, generous quota)
 *   GOOGLE_TTS_API_KEY       Google Cloud TTS fallback
 *   GROQ_API_KEY             Groq Whisper STT
 *
 * Usage:
 *   import { tts, stt, ttsStream } from '@/lib/voice'
 *
 *   const audio = await tts('Hello world')
 *   // → { audio: Buffer, provider: 'elevenlabs'|'vibevoice'|'google' } | null
 *
 *   const result = await stt(formData)
 *   // → { transcript, provider, segments? } | null
 *
 *   const stream = await ttsStream('Hello world')
 *   // → ReadableStream<Uint8Array> | null
 */

const TIMEOUT_TTS = 30_000
const TIMEOUT_STT_GROQ = 60_000
const TIMEOUT_STT_VV = 120_000 // VibeVoice-ASR-7B is large

// ── Types ─────────────────────────────────────────────────────────────────────

export type TTSProvider = 'elevenlabs' | 'vibevoice' | 'google'
export type STTProvider = 'groq' | 'vibevoice-asr'

export interface TTSResult {
  audio: Buffer
  provider: TTSProvider
}

export interface STTResult {
  transcript: string
  provider: STTProvider
  /** Only from VibeVoice-ASR — speaker diarization with timestamps */
  segments?: Array<{ speaker: string; start: number; end: number; text: string }>
}

// ── Dynamic ordering ──────────────────────────────────────────────────────────

function getTTSOrder(): TTSProvider[] {
  const env = process.env.VOICE_TTS_ORDER
  if (env) {
    const parsed = env.split(',').map(s => s.trim()) as TTSProvider[]
    if (parsed.length) return parsed
  }
  return ['elevenlabs', 'vibevoice', 'google']
}

function getSTTOrder(): STTProvider[] {
  const env = process.env.VOICE_STT_ORDER
  if (env) {
    const parsed = env.split(',').map(s => s.trim()) as STTProvider[]
    if (parsed.length) return parsed
  }
  return ['groq', 'vibevoice-asr']
}

// ── TTS Providers ─────────────────────────────────────────────────────────────

async function ttsElevenLabs(text: string): Promise<Buffer | null> {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return null

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB'
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_TTS),
    })
    if (res.status === 429) { console.warn('[voice] ElevenLabs quota hit — falling back'); return null }
    if (!res.ok) { console.warn(`[voice] ElevenLabs ${res.status}`); return null }
    return Buffer.from(await res.arrayBuffer())
  } catch (e: any) {
    console.warn('[voice] ElevenLabs error:', e.message)
    return null
  }
}

async function ttsVibeVoice(text: string): Promise<Buffer | null> {
  const token = process.env.HF_TOKEN
  if (!token) return null
  try {
    const res = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/VibeVoice-Realtime-0.5B',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'audio/wav',
        },
        body: JSON.stringify({ inputs: text }),
        signal: AbortSignal.timeout(TIMEOUT_TTS),
      }
    )
    if (res.status === 503 || res.status === 429) { console.warn('[voice] VibeVoice-TTS unavailable'); return null }
    if (!res.ok) { console.warn(`[voice] VibeVoice-TTS ${res.status}`); return null }
    return Buffer.from(await res.arrayBuffer())
  } catch (e: any) {
    console.warn('[voice] VibeVoice-TTS error:', e.message)
    return null
  }
}

async function ttsGoogle(text: string): Promise<Buffer | null> {
  const key = process.env.GOOGLE_TTS_API_KEY
  if (!key) return null
  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 },
        }),
        signal: AbortSignal.timeout(TIMEOUT_TTS),
      }
    )
    if (!res.ok) { console.warn(`[voice] Google TTS ${res.status}`); return null }
    const json = await res.json()
    if (!json.audioContent) return null
    return Buffer.from(json.audioContent, 'base64')
  } catch (e: any) {
    console.warn('[voice] Google TTS error:', e.message)
    return null
  }
}

const TTS_FNS: Record<TTSProvider, (text: string) => Promise<Buffer | null>> = {
  elevenlabs: ttsElevenLabs,
  vibevoice: ttsVibeVoice,
  google: ttsGoogle,
}

// ── STT Providers ─────────────────────────────────────────────────────────────

async function sttGroq(formData: FormData): Promise<STTResult | null> {
  const key = process.env.GROQ_API_KEY
  if (!key) return null
  const file = formData.get('audio') as File | null
  if (!file) return null
  try {
    const body = new FormData()
    body.append('file', file, file.name || 'audio.webm')
    body.append('model', 'whisper-large-v3-turbo')
    body.append('response_format', 'json')
    body.append('language', 'en')
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body,
      signal: AbortSignal.timeout(TIMEOUT_STT_GROQ),
    })
    if (!res.ok) { console.warn(`[voice] Groq STT ${res.status}`); return null }
    const data = await res.json()
    return { transcript: data.text ?? '', provider: 'groq' }
  } catch (e: any) {
    console.warn('[voice] Groq STT error:', e.message)
    return null
  }
}

async function sttVibeVoiceASR(formData: FormData): Promise<STTResult | null> {
  const token = process.env.HF_TOKEN
  if (!token) return null
  const file = formData.get('audio') as File | null
  if (!file) return null
  try {
    const audioBytes = await file.arrayBuffer()
    const res = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/VibeVoice-ASR-HF',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': file.type || 'audio/webm',
        },
        body: audioBytes,
        signal: AbortSignal.timeout(TIMEOUT_STT_VV),
      }
    )
    if (res.status === 503 || res.status === 429) { console.warn('[voice] VibeVoice-ASR unavailable'); return null }
    if (!res.ok) { console.warn(`[voice] VibeVoice-ASR ${res.status}`); return null }
    const data = await res.json()
    if (data.chunks?.length) {
      const segments = data.chunks.map((c: any) => ({
        speaker: c.speaker ?? 'Speaker',
        start: c.timestamp?.[0] ?? 0,
        end: c.timestamp?.[1] ?? 0,
        text: c.text ?? '',
      }))
      return { transcript: segments.map((s: any) => s.text).join(' '), provider: 'vibevoice-asr', segments }
    }
    return { transcript: data.text ?? '', provider: 'vibevoice-asr' }
  } catch (e: any) {
    console.warn('[voice] VibeVoice-ASR error:', e.message)
    return null
  }
}

const STT_FNS: Record<STTProvider, (formData: FormData) => Promise<STTResult | null>> = {
  groq: sttGroq,
  'vibevoice-asr': sttVibeVoiceASR,
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** TTS — runs providers in dynamic order, first success wins. Returns null if all fail. */
export async function tts(text: string): Promise<TTSResult | null> {
  const trimmed = text.trim()
  if (!trimmed) return null

  const order = getTTSOrder()
  for (const provider of order) {
    const audio = await TTS_FNS[provider](trimmed)
    if (audio) {
      console.info(`[voice] TTS via ${provider}`)
      return { audio, provider }
    }
  }

  console.warn('[voice] All TTS providers failed')
  return null
}

/**
 * ttsStream — streaming TTS for low-latency playback.
 * Tries ElevenLabs stream → VibeVoice stream → buffer fallback.
 */
export async function ttsStream(text: string): Promise<ReadableStream<Uint8Array> | null> {
  const order = getTTSOrder()

  // Streaming path — ElevenLabs native stream
  if (order[0] === 'elevenlabs' || order.includes('elevenlabs')) {
    const key = process.env.ELEVENLABS_API_KEY
    if (key) {
      const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB'
      try {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': key,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_turbo_v2_5',
              voice_settings: { stability: 0.5, similarity_boost: 0.8 },
            }),
          }
        )
        if (res.ok && res.body) {
          console.info('[voice] TTS stream via elevenlabs')
          return res.body
        }
      } catch (e: any) {
        console.warn('[voice] ElevenLabs stream error:', e.message)
      }
    }
  }

  // VibeVoice streaming via HF
  const token = process.env.HF_TOKEN
  if (token && order.includes('vibevoice')) {
    try {
      const res = await fetch(
        'https://api-inference.huggingface.co/models/microsoft/VibeVoice-Realtime-0.5B',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'audio/wav',
          },
          body: JSON.stringify({ inputs: text }),
        }
      )
      if (res.ok && res.body) {
        console.info('[voice] TTS stream via vibevoice')
        return res.body
      }
    } catch (e: any) {
      console.warn('[voice] VibeVoice stream error:', e.message)
    }
  }

  // Buffer fallback — wrap non-streaming provider result as stream
  const result = await tts(text)
  if (!result) return null

  const buf = result.audio
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buf))
      controller.close()
    },
  })
}

/** STT — runs providers in dynamic order, first success wins. Returns null if all fail. */
export async function stt(formData: FormData): Promise<STTResult | null> {
  const order = getSTTOrder()
  for (const provider of order) {
    const result = await STT_FNS[provider](formData)
    if (result) {
      console.info(`[voice] STT via ${provider}`)
      return result
    }
  }

  console.warn('[voice] All STT providers failed')
  return null
}
