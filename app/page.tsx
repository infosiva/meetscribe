'use client'
import { useState, useRef } from 'react'
import { Mic, MicOff, Upload, FileAudio, Copy, Download, CheckCircle, Zap, Clock, Users, ListChecks, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import VoiceButton from '@/components/VoiceButton'

interface ActionItem { owner: string; task: string; deadline: string }
interface MeetingSummary {
  title: string; date: string; duration: string; attendees: string[]
  summary: string; actionItems: ActionItem[]; decisions: string[]; followUpEmail: string
}
type Step = 'idle' | 'recording' | 'transcribing' | 'summarising' | 'done'

export default function MeetScribePage() {
  const [step, setStep] = useState<Step>('idle')
  const [transcript, setTranscript] = useState('')
  const [summary, setSummary] = useState<MeetingSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showEmail, setShowEmail] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); processAudio(new Blob(chunksRef.current, { type: 'audio/webm' }), 'recording.webm') }
      mr.start(); mediaRecorderRef.current = mr; setRecording(true); setStep('recording')
    } catch { setError('Microphone access denied. Upload a file instead.') }
  }

  function stopRecording() { mediaRecorderRef.current?.stop(); setRecording(false) }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processAudio(file, file.name)
  }

  async function processAudio(blob: Blob, filename: string) {
    setError(null); setSummary(null); setTranscript('')
    try {
      setStep('transcribing')
      const fd = new FormData(); fd.append('audio', blob, filename)
      const tRes = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const tData = await tRes.json()
      if (!tRes.ok) throw new Error(tData.error ?? 'Transcription failed')
      setTranscript(tData.transcript)
      setStep('summarising')
      const sRes = await fetch('/api/summarise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: tData.transcript }) })
      const sData = await sRes.json()
      if (!sRes.ok) throw new Error(sData.error ?? 'Summarisation failed')
      setSummary(sData); setStep('done')
    } catch (e: any) { setError(e.message); setStep('idle') }
  }

  async function runDemo() {
    setError(null); setSummary(null); setTranscript(''); setStep('transcribing')
    await new Promise(r => setTimeout(r, 800))
    const demo = `Hi Sarah, it's James from Premier Properties. Calling about 42 Oak Street. The Johnsons loved it — they want to offer 480,000. They have mortgage in principle, can complete in 8 weeks, rental ends July 15th. They're asking if the vendor leaves the fitted wardrobes in the master bedroom. Can you get back to me by Thursday? 07700 900123.`
    setTranscript(demo); setStep('summarising')
    const sRes = await fetch('/api/summarise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: demo }) })
    const sData = await sRes.json()
    if (!sRes.ok) { setError(sData.error); setStep('idle'); return }
    setSummary(sData); setStep('done')
  }

  function copyText(text: string, key: string) { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000) }

  function downloadNote() {
    if (!summary) return
    const text = [`# ${summary.title}`, `Date: ${summary.date}`, '', '## Summary', summary.summary, '', '## Action Items', ...summary.actionItems.map(a => `- [ ] ${a.task} (${a.owner}) — ${a.deadline}`), '', '## Decisions', ...summary.decisions.map(d => `- ${d}`), '', '## Follow-up Email', summary.followUpEmail].join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type: 'text/markdown' })), download: `${summary.title.replace(/\s+/g, '-')}.md` })
    a.click()
  }

  const statusLabel: Record<Step, string> = { idle: '', recording: 'Recording…', transcribing: 'Transcribing with Whisper AI…', summarising: 'Generating structured notes…', done: '' }

  return (
    <div className="min-h-screen bg-gray-950 relative">
      <div className="noise-overlay" aria-hidden="true" />
      <div
        className="liquid-blob liquid-blob-1"
        style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.12), transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="liquid-blob liquid-blob-2"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', animationDelay: '-6s' }}
        aria-hidden="true"
      />

      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/90 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
            <Mic size={15} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">MeetScribe</span>
          <span className="pill-glass text-xs px-2.5 py-1 ml-1">Estate Agents</span>
        </div>
        <button
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
        >
          Start free trial
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6">

        {/* Hero — idle state */}
        {step === 'idle' && !summary && (
          <section className="py-24 text-center">
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 pill-glass text-xs font-medium mb-8 px-4 py-2" style={{ color: '#0ea5e9' }}>
              <Zap size={11} /> Whisper AI · Built for estate agents
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-5">
              Turn client calls into<br />
              <span className="text-iridescent">structured notes instantly</span>
            </h1>

            <p className="text-white/50 text-lg max-w-xl mx-auto mb-12">
              Record or upload any call. MeetScribe transcribes it, extracts action items, decisions, and writes your follow-up email.
            </p>

            {/* Action cards container */}
            <div className="glass-liquid rounded-3xl p-8 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`glass-liquid flex flex-col items-center gap-3 p-6 rounded-2xl transition-all ${recording ? 'border-red-500/40 text-red-300' : 'text-white/70 hover:text-white'}`}
                  style={recording ? { borderColor: 'rgba(239,68,68,0.4)' } : {}}
                >
                  {recording ? <MicOff size={28} className="animate-pulse" /> : <Mic size={28} />}
                  <span className="text-sm font-semibold">{recording ? 'Stop recording' : 'Record call'}</span>
                  <span className="text-xs text-white/30">Live mic capture</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-liquid flex flex-col items-center gap-3 p-6 rounded-2xl text-white/70 hover:text-white transition-all"
                >
                  <Upload size={28} />
                  <span className="text-sm font-semibold">Upload audio</span>
                  <span className="text-xs text-white/30">MP3, WAV, WebM</span>
                </button>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFile} className="hidden" />

                <button
                  onClick={runDemo}
                  className="glass-liquid flex flex-col items-center gap-3 p-6 rounded-2xl transition-all"
                  style={{ borderColor: 'rgba(14,165,233,0.3)', color: '#0ea5e9' }}
                >
                  <FileAudio size={28} />
                  <span className="text-sm font-semibold">Try demo</span>
                  <span className="text-xs" style={{ color: 'rgba(14,165,233,0.6)' }}>Sample estate agent call</span>
                </button>
              </div>

              {error && (
                <div className="mt-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: <Clock size={13} />, label: 'Notes in under 30s' },
                { icon: <ListChecks size={13} />, label: 'Action items extracted' },
                { icon: <Mail size={13} />, label: 'Follow-up email written' },
                { icon: <Users size={13} />, label: 'Attendees identified' },
              ].map(f => (
                <span key={f.label} className="pill-glass flex items-center gap-1.5 text-xs px-3 py-1.5 text-white/50">
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Processing spinner */}
        {(step === 'transcribing' || step === 'summarising') && (
          <div className="text-center py-32">
            <div
              className="w-16 h-16 rounded-full border-4 animate-spin mx-auto mb-6"
              style={{ borderColor: 'rgba(14,165,233,0.25)', borderTopColor: '#0ea5e9' }}
            />
            <p className="text-white/60 text-lg">{statusLabel[step]}</p>
            <p className="text-white/30 text-sm mt-2">This takes about 10–15 seconds</p>
          </div>
        )}

        {/* Results */}
        {step === 'done' && summary && (
          <div className="py-10 space-y-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white">{summary.title}</h2>
                <div className="flex items-center gap-3 mt-1 text-white/40 text-sm flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={13} /> {summary.date}</span>
                  {summary.duration && <span>{summary.duration}</span>}
                  {summary.attendees.length > 0 && (
                    <span className="flex items-center gap-1"><Users size={13} /> {summary.attendees.join(', ')}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadNote}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.06] border border-white/[0.10] text-white/60 hover:text-white transition-colors"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={() => { setSummary(null); setStep('idle') }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
                  style={{ background: 'rgba(14,165,233,0.15)', borderColor: 'rgba(14,165,233,0.3)', color: '#0ea5e9' }}
                >
                  New meeting
                </button>
              </div>
            </div>

            {/* Summary card */}
            <div className="glass-liquid reveal-3d rounded-2xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0ea5e9' }}>Summary</h3>
              <p className="text-white/75 text-sm leading-relaxed">{summary.summary}</p>
            </div>

            {/* Action items card */}
            {summary.actionItems.length > 0 && (
              <div className="glass-liquid reveal-3d rounded-2xl p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#0ea5e9' }}>
                  <ListChecks size={13} /> Action Items
                </h3>
                <div className="space-y-2">
                  {summary.actionItems.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <div className="w-5 h-5 rounded border border-white/20 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white/80 text-sm">{a.task}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs" style={{ color: '#0ea5e9' }}>{a.owner}</span>
                          <span className="text-xs text-white/30">{a.deadline}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decisions card */}
            {summary.decisions.length > 0 && (
              <div className="glass-liquid reveal-3d rounded-2xl p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0ea5e9' }}>Decisions Made</h3>
                <ul className="space-y-1.5">
                  {summary.decisions.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" /> {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up email card */}
            <div className="glass-liquid reveal-3d rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowEmail(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#0ea5e9' }}>
                  <Mail size={13} /> Follow-up Email (ready to send)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); copyText(summary.followUpEmail, 'email') }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-white/80 transition-colors"
                  >
                    {copied === 'email' ? <><CheckCircle size={11} className="text-green-400" /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                  {showEmail ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                </div>
              </button>
              {showEmail && (
                <div className="px-5 pb-5 border-t border-white/[0.06]">
                  <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans mt-4">{summary.followUpEmail}</pre>
                </div>
              )}
            </div>

            {/* Raw transcript toggle */}
            <button
              onClick={() => setShowTranscript(v => !v)}
              className="flex items-center gap-2 text-white/30 text-xs hover:text-white/50 transition-colors"
            >
              {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showTranscript ? 'Hide' : 'Show'} raw transcript
            </button>
            {showTranscript && (
              <div className="glass-liquid rounded-xl p-4 text-white/50 text-xs leading-relaxed">{transcript}</div>
            )}
          </div>
        )}

      </main>

      <VoiceButton
        onTranscript={(text) => { /* prefill demo if idle */ }}
        color="#0ea5e9"
        position="bottom-right"
      />
    </div>
  )
}
