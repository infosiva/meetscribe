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
    <div className="min-h-screen relative">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="orb orb-1" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)' }} aria-hidden="true" />
      <div className="orb orb-2" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10), transparent 70%)', animationDelay: '-6s' }} aria-hidden="true" />
      <nav className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Mic size={16} className="text-white" /></div>
          <span className="font-bold text-white text-lg">MeetScribe</span>
          <span className="text-white/30 text-xs ml-2 border border-white/[0.10] px-2 py-0.5 rounded-full">Estate Agents</span>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-500 text-white hover:opacity-90 transition-opacity">Start free trial</button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">

        {step !== 'idle' && step !== 'done' && (
          <div className="mb-8 flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-3">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
            <span className="text-white/70 text-sm">{statusLabel[step]}</span>
          </div>
        )}

        {step === 'idle' && !summary && (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium mb-5">
                <Zap size={11} /> Built for estate agents · Works for any client call
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
                Turn client calls into<br />
                <span className="bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">structured notes instantly</span>
              </h1>
              <p className="text-white/50 text-lg max-w-xl mx-auto">Record or upload any call. MeetScribe transcribes it, extracts action items, decisions, and writes your follow-up email.</p>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={recording ? stopRecording : startRecording} className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${recording ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-white/[0.04] border-white/[0.10] text-white/70 hover:border-indigo-500/40 hover:text-white'}`}>
                  {recording ? <MicOff size={28} className="animate-pulse" /> : <Mic size={28} />}
                  <span className="text-sm font-medium">{recording ? 'Stop recording' : 'Record call'}</span>
                  <span className="text-xs text-white/30">Live mic capture</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/[0.10] bg-white/[0.04] text-white/70 hover:border-indigo-500/40 hover:text-white transition-all">
                  <Upload size={28} /><span className="text-sm font-medium">Upload audio</span><span className="text-xs text-white/30">MP3, WAV, WebM</span>
                </button>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFile} className="hidden" />
                <button onClick={runDemo} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all">
                  <FileAudio size={28} /><span className="text-sm font-medium">Try demo</span><span className="text-xs text-indigo-400/60">Sample estate agent call</span>
                </button>
              </div>
              {error && <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {[{ icon: <Clock size={13} />, label: 'Notes in under 30s' }, { icon: <ListChecks size={13} />, label: 'Action items extracted' }, { icon: <Mail size={13} />, label: 'Follow-up email written' }, { icon: <Users size={13} />, label: 'Attendees identified' }].map(f => (
                <span key={f.label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50">{f.icon} {f.label}</span>
              ))}
            </div>
          </>
        )}

        {(step === 'transcribing' || step === 'summarising') && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 animate-spin mx-auto mb-6" />
            <p className="text-white/60 text-lg">{statusLabel[step]}</p>
            <p className="text-white/30 text-sm mt-2">This takes about 10–15 seconds</p>
          </div>
        )}

        {step === 'done' && summary && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-white">{summary.title}</h2>
                <div className="flex items-center gap-3 mt-1 text-white/40 text-sm flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={13} /> {summary.date}</span>
                  {summary.duration && <span>{summary.duration}</span>}
                  {summary.attendees.length > 0 && <span className="flex items-center gap-1"><Users size={13} /> {summary.attendees.join(', ')}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={downloadNote} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.06] border border-white/[0.10] text-white/60 hover:text-white transition-colors"><Download size={14} /> Download</button>
                <button onClick={() => { setSummary(null); setStep('idle') }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-colors">New meeting</button>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Summary</h3>
              <p className="text-white/75 text-sm leading-relaxed">{summary.summary}</p>
            </div>

            {summary.actionItems.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><ListChecks size={13} /> Action Items</h3>
                <div className="space-y-2">
                  {summary.actionItems.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <div className="w-5 h-5 rounded border border-white/20 flex-shrink-0 mt-0.5" />
                      <div className="flex-1"><p className="text-white/80 text-sm">{a.task}</p><div className="flex gap-3 mt-1"><span className="text-xs text-indigo-400">{a.owner}</span><span className="text-xs text-white/30">{a.deadline}</span></div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.decisions.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Decisions Made</h3>
                <ul className="space-y-1.5">
                  {summary.decisions.map((d, i) => <li key={i} className="flex items-start gap-2 text-sm text-white/70"><CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />{d}</li>)}
                </ul>
              </div>
            )}

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
              <button onClick={() => setShowEmail(v => !v)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5"><Mail size={13} /> Follow-up Email (ready to send)</h3>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); copyText(summary.followUpEmail, 'email') }} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-white/80 transition-colors">
                    {copied === 'email' ? <><CheckCircle size={11} className="text-green-400" /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                  {showEmail ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                </div>
              </button>
              {showEmail && <div className="px-5 pb-5 border-t border-white/[0.06]"><pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans mt-4">{summary.followUpEmail}</pre></div>}
            </div>

            <button onClick={() => setShowTranscript(v => !v)} className="flex items-center gap-2 text-white/30 text-xs hover:text-white/50 transition-colors">
              {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {showTranscript ? 'Hide' : 'Show'} raw transcript
            </button>
            {showTranscript && <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-white/50 text-xs leading-relaxed">{transcript}</div>}
          </div>
        )}
      </main>

      <VoiceButton
        onTranscript={(text) => { /* prefill demo if idle */ }}
        color="#6366f1"
        position="bottom-right"
      />
    </div>
  )
}
