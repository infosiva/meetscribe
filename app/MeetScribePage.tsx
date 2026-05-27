'use client'
import { useState, useRef } from 'react'
import { Mic, MicOff, Upload, FileAudio, Copy, Download, CheckCircle, Zap, Clock, Users, ListChecks, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import VoiceButton from '@/components/VoiceButton'
import type { ContentOverrides } from '@/lib/content'

interface ActionItem { owner: string; task: string; deadline: string }
interface MeetingSummary {
  title: string; date: string; duration: string; attendees: string[]
  summary: string; actionItems: ActionItem[]; decisions: string[]; followUpEmail: string
}
type Step = 'idle' | 'recording' | 'transcribing' | 'summarising' | 'done'

const T = {
  bg: '#050b14',
  s1: '#0a1220',
  s2: '#0f1a2e',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(14,165,233,0.22)',
  text: '#e0f2fe',
  muted: 'rgba(255,255,255,0.38)',
  sky: '#0ea5e9',
  sky2: '#0284c7',
  teal: '#14b8a6',
  green: '#4ade80',
}

export default function MeetScribePage({ overrides = {} }: { overrides?: ContentOverrides }) {
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
    <div style={{ background: T.bg, color: T.text, fontFamily: 'Inter,system-ui,sans-serif', minHeight: '100vh' }}>
      <style>{`
        *{box-sizing:border-box}
        .nav{position:sticky;top:0;z-index:50;background:rgba(5,11,20,0.9);backdrop-filter:blur(16px);border-bottom:1px solid ${T.border};padding:0 20px;height:50px;display:flex;align-items:center;justify-content:space-between}
        .logo{display:flex;align-items:center;gap:10px}
        .logo-icon{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${T.sky},${T.sky2});display:flex;align-items:center;justify-content:center}
        .logo-name{font-size:16px;font-weight:800;color:#e0f2fe;letter-spacing:-0.3px}
        .pill{display:inline-flex;align-items:center;padding:3px 10px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.2);border-radius:100px;font-size:10px;font-weight:600;color:${T.sky};margin-left:6px}
        .btn-sky{background:linear-gradient(135deg,${T.sky},${T.sky2});color:#fff;font-size:12px;font-weight:700;padding:8px 16px;border-radius:10px;border:none;cursor:pointer;transition:opacity 0.15s}
        .btn-sky:hover{opacity:0.85}
        .tool-zone{max-width:760px;margin:0 auto;padding:24px 20px 0}
        .top-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px}
        .top-title h1{font-size:clamp(18px,3vw,24px);font-weight:900;letter-spacing:-0.5px;color:#e0f2fe;margin-bottom:4px}
        .top-title p{font-size:12px;color:${T.muted}}
        .action-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
        .action-card{background:${T.s1};border:1px solid ${T.border};border-radius:14px;padding:18px 14px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:all 0.15s;text-align:center}
        .action-card:hover{border-color:rgba(14,165,233,0.3);background:${T.s2}}
        .action-card.active{border-color:rgba(239,68,68,0.45);background:rgba(239,68,68,0.06)}
        .action-card.highlight{border-color:rgba(14,165,233,0.3);background:rgba(14,165,233,0.05)}
        .ac-icon{font-size:22px;line-height:1}
        .ac-title{font-size:12px;font-weight:700;color:#e0f2fe}
        .ac-sub{font-size:10px;color:${T.muted}}
        .error-box{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:10px 14px;color:rgba(239,68,68,0.85);font-size:12px;margin-bottom:14px}
        .feat-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}
        .feat-pill{display:flex;align-items:center;gap:5px;background:${T.s1};border:1px solid ${T.border};border-radius:8px;padding:6px 10px;font-size:11px;color:${T.muted}}
        .spinner{width:44px;height:44px;border:3px solid rgba(14,165,233,0.15);border-top-color:${T.sky};border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .result-wrap{max-width:760px;margin:0 auto;padding:0 20px 40px}
        .result-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
        .result-title h2{font-size:18px;font-weight:800;color:#e0f2fe;margin-bottom:4px}
        .result-meta{display:flex;align-items:center;gap:12px;font-size:11px;color:${T.muted};flex-wrap:wrap}
        .result-btns{display:flex;gap:8px;flex-wrap:wrap}
        .rbtn{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:9px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid ${T.border};background:rgba(255,255,255,0.04);color:${T.muted};transition:all 0.15s}
        .rbtn:hover{color:#fff}
        .rbtn.sky{background:rgba(14,165,233,0.12);border-color:rgba(14,165,233,0.25);color:${T.sky}}
        .card{background:${T.s1};border:1px solid ${T.border};border-radius:14px;padding:16px;margin-bottom:12px}
        .card-label{font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:${T.sky};margin-bottom:10px}
        .card p{font-size:13px;color:rgba(255,255,255,0.7);line-height:1.65}
        .action-item{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .action-item:last-child{border-bottom:none}
        .ai-check{width:16px;height:16px;border:1px solid rgba(255,255,255,0.2);border-radius:4px;flex-shrink:0;margin-top:2px}
        .ai-task{font-size:12px;color:rgba(255,255,255,0.75)}
        .ai-meta{display:flex;gap:10px;margin-top:3px}
        .ai-owner{font-size:10px;color:${T.sky}}
        .ai-dl{font-size:10px;color:${T.muted}}
        .decision-item{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:rgba(255,255,255,0.68);margin-bottom:6px}
        .email-toggle{display:flex;align-items:center;justify-content:space-between;padding:12px 0;cursor:pointer}
        .email-body{padding:12px 0;border-top:1px solid rgba(255,255,255,0.05)}
        .email-body pre{font-size:12px;color:rgba(255,255,255,0.65);line-height:1.7;white-space:pre-wrap;font-family:inherit}
        .transcript-toggle{display:flex;align-items:center;gap:6px;font-size:11px;color:${T.muted};cursor:pointer;margin-top:8px;padding:4px 0}
        .transcript-toggle:hover{color:rgba(255,255,255,0.6)}
        .transcript-box{background:${T.s1};border:1px solid ${T.border};border-radius:10px;padding:12px 14px;font-size:11px;color:${T.muted};line-height:1.7;margin-top:8px}
        .recording-pulse{display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:100px;padding:4px 10px;font-size:11px;font-weight:700;color:rgba(239,68,68,0.9);animation:pulse 1.5s ease infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        .rec-dot{width:7px;height:7px;border-radius:50%;background:rgba(239,68,68,0.9);animation:pulse 1.5s ease infinite}
        @media(max-width:600px){
          .action-grid{grid-template-columns:1fr 1fr 1fr;gap:8px}
          .action-card{padding:14px 10px}
          .ac-title{font-size:11px}
          .result-header{flex-direction:column}
          .top-row{flex-direction:column;align-items:flex-start}
        }
        @media(max-width:400px){
          .action-grid{grid-template-columns:1fr}
          .feat-row{gap:6px}
        }
      `}</style>

      {/* Nav */}
      <nav className="nav">
        <div className="logo">
          <div className="logo-icon"><Mic size={14} color="#fff" /></div>
          <span className="logo-name">MeetScribe</span>
          <span className="pill">Estate Agents</span>
        </div>
        <button className="btn-sky">Start free trial</button>
      </nav>

      {/* Tool zone — always visible above fold */}
      <div className="tool-zone">
        <div className="top-row">
          <div className="top-title">
            <h1>{overrides.headline ?? 'Turn client calls into structured notes'}</h1>
            <p>{overrides.subheadline ?? 'Record or upload any call — action items, decisions, follow-up email in under 30s'}</p>
          </div>
          {recording && (
            <div className="recording-pulse">
              <div className="rec-dot" /> Recording…
            </div>
          )}
        </div>

        {/* Action cards */}
        {step === 'idle' && !summary && (
          <>
            <div className="action-grid">
              <button
                className={`action-card${recording ? ' active' : ''}`}
                onClick={recording ? stopRecording : startRecording}
              >
                <div className="ac-icon">{recording ? <MicOff size={22} color="rgba(239,68,68,0.9)" /> : <Mic size={22} color={T.sky} />}</div>
                <div className="ac-title">{recording ? 'Stop recording' : 'Record call'}</div>
                <div className="ac-sub">Live mic capture</div>
              </button>
              <button className="action-card" onClick={() => fileInputRef.current?.click()}>
                <div className="ac-icon"><Upload size={22} color={T.sky} /></div>
                <div className="ac-title">Upload audio</div>
                <div className="ac-sub">MP3, WAV, WebM</div>
              </button>
              <button className="action-card highlight" onClick={runDemo}>
                <div className="ac-icon"><FileAudio size={22} color={T.sky} /></div>
                <div className="ac-title">Try demo</div>
                <div className="ac-sub">Sample estate call</div>
              </button>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFile} className="hidden" style={{ display: 'none' }} />
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="feat-row">
              {[
                { icon: <Clock size={12} />, label: 'Notes in under 30s' },
                { icon: <ListChecks size={12} />, label: 'Action items extracted' },
                { icon: <Mail size={12} />, label: 'Follow-up email written' },
                { icon: <Users size={12} />, label: 'Attendees identified' },
                { icon: <Zap size={12} />, label: 'Whisper AI transcription' },
              ].map(f => (
                <span key={f.label} className="feat-pill">{f.icon} {f.label}</span>
              ))}
            </div>
          </>
        )}

        {/* Processing */}
        {(step === 'transcribing' || step === 'summarising') && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div className="spinner" />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{statusLabel[step]}</p>
            <p style={{ color: T.muted, fontSize: 12 }}>About 10–15 seconds</p>
          </div>
        )}
      </div>

      {/* Results */}
      {step === 'done' && summary && (
        <div className="result-wrap" style={{ paddingTop: 20 }}>
          <div className="result-header">
            <div className="result-title">
              <h2>{summary.title}</h2>
              <div className="result-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {summary.date}</span>
                {summary.duration && <span>{summary.duration}</span>}
                {summary.attendees.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} /> {summary.attendees.join(', ')}</span>
                )}
              </div>
            </div>
            <div className="result-btns">
              <button className="rbtn" onClick={downloadNote}><Download size={12} /> Download</button>
              <button className="rbtn sky" onClick={() => { setSummary(null); setStep('idle') }}>New meeting</button>
            </div>
          </div>

          {/* Summary */}
          <div className="card">
            <div className="card-label">Summary</div>
            <p>{summary.summary}</p>
          </div>

          {/* Action items */}
          {summary.actionItems.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ListChecks size={11} /> Action Items</div>
              {summary.actionItems.map((a, i) => (
                <div key={i} className="action-item">
                  <div className="ai-check" />
                  <div>
                    <div className="ai-task">{a.task}</div>
                    <div className="ai-meta">
                      <span className="ai-owner">{a.owner}</span>
                      <span className="ai-dl">{a.deadline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Decisions */}
          {summary.decisions.length > 0 && (
            <div className="card">
              <div className="card-label">Decisions Made</div>
              {summary.decisions.map((d, i) => (
                <div key={i} className="decision-item">
                  <CheckCircle size={13} color={T.green} style={{ flexShrink: 0, marginTop: 1 }} /> {d}
                </div>
              ))}
            </div>
          )}

          {/* Follow-up email */}
          <div className="card">
            <div
              className="email-toggle"
              onClick={() => setShowEmail(v => !v)}
            >
              <div className="card-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={11} /> Follow-up Email (ready to send)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={e => { e.stopPropagation(); copyText(summary.followUpEmail, 'email') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: T.muted, cursor: 'pointer' }}
                >
                  {copied === 'email' ? <><CheckCircle size={10} color={T.green} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
                {showEmail ? <ChevronUp size={14} color={T.muted} /> : <ChevronDown size={14} color={T.muted} />}
              </div>
            </div>
            {showEmail && (
              <div className="email-body">
                <pre>{summary.followUpEmail}</pre>
              </div>
            )}
          </div>

          {/* Raw transcript toggle */}
          <div className="transcript-toggle" onClick={() => setShowTranscript(v => !v)}>
            {showTranscript ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showTranscript ? 'Hide' : 'Show'} raw transcript
          </div>
          {showTranscript && (
            <div className="transcript-box">{transcript}</div>
          )}
        </div>
      )}

      <VoiceButton
        onTranscript={() => {}}
        color={T.sky}
        position="bottom-right"
      />
    </div>
  )
}
