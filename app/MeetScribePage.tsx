'use client'
import { useState, useRef } from 'react'
import { Mic, MicOff, Upload, FileAudio, Copy, Download, CheckCircle, Zap, Clock, Users, ListChecks, Mail, ChevronDown, ChevronUp, FileText, Settings } from 'lucide-react'
import VoiceButton from '@/components/VoiceButton'
import type { ContentOverrides } from '@/lib/content'

interface ActionItem { owner: string; task: string; deadline: string }
interface MeetingSummary {
  title: string; date: string; duration: string; attendees: string[]
  summary: string; actionItems: ActionItem[]; decisions: string[]; followUpEmail: string
}
type Step = 'idle' | 'recording' | 'transcribing' | 'summarising' | 'done'
type FeatureTab = 'transcription' | 'summaries' | 'actions' | 'integrations'

const C = {
  bg: '#0a0a0f',
  s1: '#111118',
  s2: '#16161f',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(6,182,212,0.25)',
  text: '#f0f0f8',
  muted: 'rgba(255,255,255,0.38)',
  cyan: '#06b6d4',
  cyan2: '#0891b2',
  green: '#4ade80',
  red: 'rgba(239,68,68,0.9)',
}

const TABS: { id: FeatureTab; label: string }[] = [
  { id: 'transcription', label: 'Transcription' },
  { id: 'summaries', label: 'Summaries' },
  { id: 'actions', label: 'Action Items' },
  { id: 'integrations', label: 'Integrations' },
]

const FEATURE_CONTENT: Record<FeatureTab, {
  title: string; desc: string; bullets: string[]; mockup: React.ReactNode
}> = {
  transcription: {
    title: 'Whisper-powered transcription',
    desc: 'Upload any audio file or record directly in your browser. Our AI transcribes in under 30 seconds with speaker detection.',
    bullets: [
      'Supports MP3, WAV, WebM, M4A formats',
      'Speaker diarisation — knows who said what',
      'Handles accents, crosstalk and estate agent jargon',
    ],
    mockup: (
      <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', color: C.cyan, marginBottom: 12, textTransform: 'uppercase' }}>Live transcript</div>
        {[
          { speaker: 'James', text: 'Calling about 42 Oak Street — the Johnsons loved it.' },
          { speaker: 'Sarah', text: "Great, what's their offer?" },
          { speaker: 'James', text: 'Four-eighty. Mortgage in principle, complete in 8 weeks.' },
          { speaker: 'Sarah', text: "I'll get back to you by Thursday." },
        ].map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: i % 2 === 0 ? C.cyan : '#a78bfa', minWidth: 44, paddingTop: 1 }}>{line.speaker}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{line.text}</span>
          </div>
        ))}
      </div>
    ),
  },
  summaries: {
    title: 'Structured meeting notes in seconds',
    desc: 'No more free-form blobs. Every call becomes a clean structured document: summary, decisions, context — ready to file.',
    bullets: [
      'Title, date, attendees auto-extracted',
      'Key decisions highlighted separately',
      'Download as Markdown or copy to clipboard',
    ],
    mockup: (
      <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 8 }}>Property viewing — 42 Oak Street</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>James Carter · Sarah Wong · 3 Jun 2026 · 4 min</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan, letterSpacing: '0.8px', marginBottom: 6, textTransform: 'uppercase' }}>Summary</div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 12 }}>Johnsons offer £480k on 42 Oak Street. Mortgage in principle confirmed, 8-week completion. Vendor to confirm fitted wardrobes.</p>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: '0.8px', marginBottom: 6, textTransform: 'uppercase' }}>Decisions</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
          <CheckCircle size={11} color="#4ade80" style={{ flexShrink: 0, marginTop: 1 }} /> Offer to be presented to vendor by Thursday
        </div>
      </div>
    ),
  },
  actions: {
    title: 'Action items, auto-assigned',
    desc: 'Every commitment spoken in the meeting becomes a checkbox. Owner, task, and deadline extracted — no manual entry.',
    bullets: [
      'Named owner pulled from transcript automatically',
      'Deadline inference from natural language ("by Thursday")',
      'One-click send to Jira, Notion or Slack',
    ],
    mockup: (
      <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan, letterSpacing: '0.8px', marginBottom: 12, textTransform: 'uppercase' }}>Action Items</div>
        {[
          { task: 'Present £480k offer to vendor', owner: 'Sarah', deadline: 'Thu 5 Jun' },
          { task: 'Confirm wardrobes decision with vendor', owner: 'Sarah', deadline: 'Thu 5 Jun' },
          { task: 'Send mortgage docs to solicitor', owner: 'James', deadline: 'Fri 6 Jun' },
        ].map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingBottom: 8, marginBottom: 8, borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ width: 14, height: 14, border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 3, flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 3 }}>{a.task}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 10, color: C.cyan }}>{a.owner}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{a.deadline}</span>
              </div>
            </div>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(6,182,212,0.1)', border: `1px solid rgba(6,182,212,0.2)`, color: C.cyan, fontWeight: 700 }}>Jira</span>
          </div>
        ))}
      </div>
    ),
  },
  integrations: {
    title: 'Push to your stack automatically',
    desc: 'Connect once. Every meeting\'s action items flow to your tools — no copy-paste, no tab-switching, no forgotten tasks.',
    bullets: [
      'Notion: creates a new page per meeting',
      'Jira: opens tickets with owner + deadline',
      'Slack: posts summary to your channel',
    ],
    mockup: (
      <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan, letterSpacing: '0.8px', marginBottom: 14, textTransform: 'uppercase' }}>Connected apps</div>
        {[
          { name: 'Notion', status: 'Connected', color: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
          { name: 'Jira', status: 'Connected', color: C.cyan, bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
          { name: 'Slack', status: 'Connected', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
          { name: 'Linear', status: 'Not connected', color: C.muted, bg: 'transparent', border: C.border },
        ].map((app) => (
          <div key={app.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{app.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: app.bg, border: `1px solid ${app.border}`, color: app.color }}>{app.status}</span>
          </div>
        ))}
      </div>
    ),
  },
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
  const [activeTab, setActiveTab] = useState<FeatureTab>('transcription')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toolRef = useRef<HTMLDivElement>(null)

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      setError(msg); setStep('idle')
    }
  }

  async function runDemo() {
    setError(null); setSummary(null); setTranscript(''); setStep('transcribing')
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  const feat = FEATURE_CONTENT[activeTab]

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'Inter,system-ui,sans-serif', minHeight: '100vh' }}>
      <style>{`
        *{box-sizing:border-box}
        /* ── Hero ── */
        .ms-hero{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1120px;margin:0 auto;padding:56px 24px 48px}
        .ms-hero-left h1{font-size:clamp(28px,4vw,48px);font-weight:900;line-height:1.1;letter-spacing:-1px;color:#f0f0f8;margin-bottom:14px}
        .ms-hero-left h1 span{color:${C.cyan}}
        .ms-hero-left p{font-size:15px;color:rgba(255,255,255,0.55);line-height:1.65;max-width:440px;margin-bottom:28px}
        .ms-cta-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .ms-btn-primary{background:${C.cyan};color:#000;font-size:13px;font-weight:800;padding:11px 24px;border-radius:10px;border:none;cursor:pointer;transition:opacity 0.12s,transform 0.12s;letter-spacing:-0.2px}
        .ms-btn-primary:hover{opacity:0.88}
        .ms-btn-primary:active{transform:scale(0.97)}
        .ms-btn-ghost{background:transparent;color:rgba(255,255,255,0.55);font-size:13px;font-weight:600;padding:11px 20px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;transition:all 0.12s}
        .ms-btn-ghost:hover{border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.8)}
        .ms-btn-ghost:active{transform:scale(0.97)}
        /* transcript mockup */
        .ms-mockup{background:${C.s1};border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px 22px;position:relative;overflow:hidden}
        .ms-mockup::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 10%,rgba(6,182,212,0.06) 0%,transparent 60%);pointer-events:none}
        .ms-mockup-bar{display:flex;align-items:center;gap:6px;margin-bottom:16px}
        .ms-dot{width:8px;height:8px;border-radius:50%}
        .ms-mockup-label{font-size:10px;font-weight:700;letter-spacing:0.8px;color:${C.cyan};text-transform:uppercase;margin-left:auto}
        .ms-line{display:flex;gap:8px;margin-bottom:10px;animation:fadeSlide 0.4s ease both}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        /* How it works */
        .ms-how{max-width:1120px;margin:0 auto;padding:0 24px 48px}
        .ms-how-title{font-size:12px;font-weight:700;letter-spacing:1px;color:${C.cyan};text-transform:uppercase;margin-bottom:20px;text-align:center}
        .ms-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
        .ms-step{display:flex;align-items:flex-start;gap:14px;padding:20px 22px;background:${C.s1};border:1px solid ${C.border};border-radius:12px;margin:0 6px}
        .ms-step-num{width:28px;height:28px;border-radius:8px;background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${C.cyan};flex-shrink:0}
        .ms-step h3{font-size:13px;font-weight:700;color:${C.text};margin-bottom:4px}
        .ms-step p{font-size:11px;color:${C.muted};line-height:1.55}
        /* Feature tabs */
        .ms-features{max-width:1120px;margin:0 auto;padding:0 24px 48px}
        .ms-section-label{font-size:12px;font-weight:700;letter-spacing:1px;color:${C.cyan};text-transform:uppercase;margin-bottom:20px;text-align:center}
        .ms-tabs{display:flex;gap:4px;background:${C.s1};border:1px solid ${C.border};border-radius:12px;padding:4px;margin-bottom:24px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .ms-tabs::-webkit-scrollbar{display:none}
        .ms-tab{flex:1;min-width:max-content;padding:8px 16px;border-radius:9px;border:none;background:transparent;color:${C.muted};font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;white-space:nowrap}
        .ms-tab.active{background:rgba(6,182,212,0.12);color:${C.cyan};border:1px solid rgba(6,182,212,0.2)}
        .ms-tab:hover:not(.active){color:rgba(255,255,255,0.7)}
        .ms-feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start}
        .ms-feat-title{font-size:20px;font-weight:800;color:${C.text};letter-spacing:-0.3px;margin-bottom:10px}
        .ms-feat-desc{font-size:13px;color:rgba(255,255,255,0.5);line-height:1.65;margin-bottom:18px}
        .ms-feat-bullets{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
        .ms-feat-bullets li{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5}
        .ms-feat-bullets li::before{content:'';width:5px;height:5px;border-radius:50%;background:${C.cyan};flex-shrink:0;margin-top:5px}
        /* Pricing */
        .ms-pricing{max-width:1120px;margin:0 auto;padding:0 24px 48px}
        .ms-price-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:640px;margin:0 auto}
        .ms-price-card{background:${C.s1};border:1px solid ${C.border};border-radius:14px;padding:24px 22px}
        .ms-price-card.pro{border-color:rgba(6,182,212,0.3);background:rgba(6,182,212,0.04)}
        .ms-price-name{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${C.muted};margin-bottom:10px}
        .ms-price-amount{font-size:32px;font-weight:900;color:${C.text};letter-spacing:-1px;margin-bottom:4px}
        .ms-price-amount span{font-size:14px;font-weight:500;color:${C.muted}}
        .ms-price-divider{height:1px;background:${C.border};margin:16px 0}
        .ms-price-features{list-style:none;padding:0;margin:0 0 20px;display:flex;flex-direction:column;gap:8px}
        .ms-price-features li{display:flex;align-items:center;gap:7px;font-size:12px;color:rgba(255,255,255,0.6)}
        .ms-price-features li svg{flex-shrink:0}
        .ms-btn-plan{width:100%;padding:10px 16px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:opacity 0.12s,transform 0.12s}
        .ms-btn-plan:active{transform:scale(0.97)}
        .ms-btn-plan.free{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.7);border:1px solid ${C.border}}
        .ms-btn-plan.pro{background:${C.cyan};color:#000}
        .ms-btn-plan.pro:hover{opacity:0.88}
        /* Tool */
        .ms-tool{max-width:760px;margin:0 auto;padding:0 24px 48px}
        .ms-tool-inner{background:${C.s1};border:1px solid ${C.border};border-radius:16px;padding:24px}
        .ms-tool-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px}
        .ms-tool-title{font-size:16px;font-weight:800;color:${C.text};letter-spacing:-0.3px}
        .ms-tool-sub{font-size:11px;color:${C.muted};margin-top:3px}
        .ms-action-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
        .ms-action-card{background:${C.bg};border:1px solid ${C.border};border-radius:12px;padding:16px 12px;display:flex;flex-direction:column;align-items:center;gap:7px;cursor:pointer;transition:all 0.15s;text-align:center}
        .ms-action-card:hover{border-color:rgba(6,182,212,0.3);background:${C.s2}}
        .ms-action-card.active{border-color:rgba(239,68,68,0.4);background:rgba(239,68,68,0.05)}
        .ms-action-card.highlight{border-color:rgba(6,182,212,0.3);background:rgba(6,182,212,0.05)}
        .ms-ac-title{font-size:11px;font-weight:700;color:${C.text}}
        .ms-ac-sub{font-size:10px;color:${C.muted}}
        .ms-error{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:9px 12px;color:rgba(239,68,68,0.85);font-size:12px;margin-bottom:12px}
        .ms-spinner{width:40px;height:40px;border:3px solid rgba(6,182,212,0.15);border-top-color:${C.cyan};border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 14px}
        @keyframes spin{to{transform:rotate(360deg)}}
        /* Results */
        .ms-card{background:${C.bg};border:1px solid ${C.border};border-radius:12px;padding:14px 16px;margin-bottom:10px}
        .ms-card-label{font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:${C.cyan};margin-bottom:8px}
        .ms-card p{font-size:12px;color:rgba(255,255,255,0.65);line-height:1.65}
        .ms-ai-item{display:flex;align-items:flex-start;gap:9px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .ms-ai-item:last-child{border-bottom:none}
        .ms-rec-pulse{display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:100px;padding:4px 10px;font-size:11px;font-weight:700;color:rgba(239,68,68,0.9);animation:blink 1.4s ease infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.55}}
        .ms-rec-dot{width:7px;height:7px;border-radius:50%;background:rgba(239,68,68,0.9)}
        /* Responsive */
        @media(max-width:768px){
          .ms-hero{grid-template-columns:1fr;gap:28px;padding:36px 16px 32px}
          .ms-steps{grid-template-columns:1fr;gap:8px}
          .ms-step{margin:0}
          .ms-feat-grid{grid-template-columns:1fr;gap:20px}
          .ms-price-grid{grid-template-columns:1fr}
          .ms-how,.ms-features,.ms-pricing,.ms-tool{padding-left:16px;padding-right:16px}
          .ms-action-grid{grid-template-columns:1fr 1fr 1fr;gap:8px}
        }
        @media(max-width:480px){
          .ms-hero-left h1{font-size:26px}
          .ms-action-grid{grid-template-columns:1fr}
        }
        @media(prefers-reduced-motion:reduce){
          .ms-line,.ms-btn-primary,.ms-btn-ghost,.ms-action-card,.ms-btn-plan{transition:none;animation:none}
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="ms-hero">
        <div className="ms-hero-left">
          <h1>
            {overrides.headline
              ? overrides.headline
              : <><span>Meeting done.</span><br />Notes ready instantly.</>
            }
          </h1>
          <p>{overrides.subheadline ?? 'Record or upload any client call. AI transcribes, extracts action items and drafts follow-up emails — in under 30 seconds.'}</p>
          <div className="ms-cta-row">
            <button className="ms-btn-primary" onClick={() => { toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
              {overrides.cta ?? 'Try it free'}
            </button>
            <button className="ms-btn-ghost" onClick={runDemo}>See a demo call</button>
          </div>
        </div>

        {/* Transcript mockup */}
        <div className="ms-mockup">
          <div className="ms-mockup-bar">
            <div className="ms-dot" style={{ background: '#ff5f57' }} />
            <div className="ms-dot" style={{ background: '#febc2e' }} />
            <div className="ms-dot" style={{ background: '#28c840' }} />
            <span className="ms-mockup-label">Live transcript</span>
          </div>
          {[
            { speaker: 'James', color: C.cyan, text: 'Calling re: 42 Oak Street — Johnsons want to offer 480k.' },
            { speaker: 'Sarah', color: '#a78bfa', text: 'Confirmed. Mortgage in principle, 8-week completion?' },
            { speaker: 'James', color: C.cyan, text: "Yes. They're also asking about the fitted wardrobes." },
            { speaker: 'Sarah', color: '#a78bfa', text: "I'll check with the vendor and come back Thursday." },
          ].map((line, i) => (
            <div key={i} className="ms-line" style={{ animationDelay: `${i * 0.12}s` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: line.color, minWidth: 42, paddingTop: 2, flexShrink: 0 }}>{line.speaker}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{line.text}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(6,182,212,0.06)', border: `1px solid rgba(6,182,212,0.15)`, borderRadius: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.cyan, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5 }}>Action items extracted</div>
            {['Sarah — Present offer to vendor (Thu)', 'Sarah — Confirm wardrobes with vendor (Thu)'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: i === 0 ? 4 : 0 }}>
                <CheckCircle size={9} color={C.green} /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="ms-how">
        <div className="ms-how-title">How it works</div>
        <div className="ms-steps">
          {[
            { n: '1', icon: <Upload size={14} color={C.cyan} />, title: 'Upload or record', desc: 'Drop an MP3, WAV or WebM — or hit record and capture the call live.' },
            { n: '2', icon: <Zap size={14} color={C.cyan} />, title: 'AI transcribes', desc: 'Whisper AI transcribes in under 30 seconds with speaker detection.' },
            { n: '3', icon: <ListChecks size={14} color={C.cyan} />, title: 'Notes + actions sent', desc: 'Summary, decisions and action items auto-assigned to your stack.' },
          ].map(s => (
            <div key={s.n} className="ms-step">
              <div className="ms-step-num">{s.n}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE TABS ── */}
      <section className="ms-features">
        <div className="ms-section-label">Features</div>
        <div className="ms-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`ms-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="ms-feat-grid" role="tabpanel">
          <div>
            <div className="ms-feat-title">{feat.title}</div>
            <div className="ms-feat-desc">{feat.desc}</div>
            <ul className="ms-feat-bullets" aria-label="Feature highlights">
              {feat.bullets.map(b => <li key={b}>{b}</li>)}
            </ul>
          </div>
          <div>{feat.mockup}</div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="ms-pricing">
        <div className="ms-section-label">Pricing</div>
        <div className="ms-price-grid">
          <div className="ms-price-card">
            <div className="ms-price-name">Free</div>
            <div className="ms-price-amount">£0<span> / month</span></div>
            <div className="ms-price-divider" />
            <ul className="ms-price-features">
              {['5 meetings / month', 'Transcription', 'AI summary', 'Action items', 'Download Markdown'].map(f => (
                <li key={f}><CheckCircle size={11} color={C.cyan} /> {f}</li>
              ))}
            </ul>
            <button className="ms-btn-plan free" onClick={() => toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              Start for free
            </button>
          </div>
          <div className="ms-price-card pro">
            <div className="ms-price-name" style={{ color: C.cyan }}>Pro</div>
            <div className="ms-price-amount">£12<span> / month</span></div>
            <div className="ms-price-divider" />
            <ul className="ms-price-features">
              {['Unlimited meetings', 'Everything in Free', 'Notion + Jira + Slack sync', 'Follow-up email draft', 'Priority support'].map(f => (
                <li key={f}><CheckCircle size={11} color={C.cyan} /> {f}</li>
              ))}
            </ul>
            <button className="ms-btn-plan pro" onClick={() => toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              Get Pro
            </button>
          </div>
        </div>
      </section>

      {/* ── TOOL ── */}
      <section className="ms-tool" ref={toolRef}>
        <div className="ms-section-label">Try it now</div>
        <div className="ms-tool-inner">
          <div className="ms-tool-header">
            <div>
              <div className="ms-tool-title">Transcribe a meeting</div>
              <div className="ms-tool-sub">Record live, upload a file, or run the demo call</div>
            </div>
            {recording && (
              <div className="ms-rec-pulse">
                <div className="ms-rec-dot" /> Recording…
              </div>
            )}
          </div>

          {step === 'idle' && !summary && (
            <>
              <div className="ms-action-grid">
                <button
                  className={`ms-action-card${recording ? ' active' : ''}`}
                  onClick={recording ? stopRecording : startRecording}
                >
                  {recording ? <MicOff size={20} color={C.red} /> : <Mic size={20} color={C.cyan} />}
                  <div className="ms-ac-title">{recording ? 'Stop' : 'Record call'}</div>
                  <div className="ms-ac-sub">Live mic</div>
                </button>
                <button className="ms-action-card" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={20} color={C.cyan} />
                  <div className="ms-ac-title">Upload audio</div>
                  <div className="ms-ac-sub">MP3, WAV, WebM</div>
                </button>
                <button className="ms-action-card highlight" onClick={runDemo}>
                  <FileAudio size={20} color={C.cyan} />
                  <div className="ms-ac-title">Demo call</div>
                  <div className="ms-ac-sub">Estate agent sample</div>
                </button>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFile} style={{ display: 'none' }} />
              </div>

              {error && <div className="ms-error">{error}</div>}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { icon: <Clock size={11} />, label: 'Notes in 30s' },
                  { icon: <ListChecks size={11} />, label: 'Actions extracted' },
                  { icon: <Mail size={11} />, label: 'Follow-up email' },
                  { icon: <Users size={11} />, label: 'Speaker detection' },
                  { icon: <Zap size={11} />, label: 'Whisper AI' },
                ].map(f => (
                  <span key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 9px', fontSize: 10, color: C.muted }}>
                    {f.icon} {f.label}
                  </span>
                ))}
              </div>
            </>
          )}

          {(step === 'transcribing' || step === 'summarising') && (
            <div style={{ textAlign: 'center', padding: '36px 20px' }}>
              <div className="ms-spinner" />
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{statusLabel[step]}</p>
              <p style={{ color: C.muted, fontSize: 11 }}>About 10–15 seconds</p>
            </div>
          )}

          {step === 'done' && summary && (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>{summary.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: C.muted, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {summary.date}</span>
                    {summary.duration && <span>{summary.duration}</span>}
                    {summary.attendees.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} /> {summary.attendees.join(', ')}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={downloadNote} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: C.muted }}>
                    <Download size={11} /> Download
                  </button>
                  <button onClick={() => { setSummary(null); setStep('idle') }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid rgba(6,182,212,0.25)`, background: 'rgba(6,182,212,0.1)', color: C.cyan }}>
                    New meeting
                  </button>
                </div>
              </div>

              <div className="ms-card">
                <div className="ms-card-label">Summary</div>
                <p>{summary.summary}</p>
              </div>

              {summary.actionItems.length > 0 && (
                <div className="ms-card">
                  <div className="ms-card-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ListChecks size={10} /> Action Items</div>
                  {summary.actionItems.map((a, i) => (
                    <div key={i} className="ms-ai-item" style={{ flexWrap: 'wrap', gap: 7 }}>
                      <div style={{ width: 14, height: 14, border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 3, flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{a.task}</div>
                        <div style={{ display: 'flex', gap: 9, marginTop: 2 }}>
                          <span style={{ fontSize: 10, color: C.cyan }}>{a.owner}</span>
                          <span style={{ fontSize: 10, color: C.muted }}>{a.deadline}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[{ label: 'Notion', color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' },
                          { label: 'Jira', color: C.cyan, bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.18)' },
                          { label: 'Slack', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.18)' }
                        ].map(btn => (
                          <a key={btn.label} href={`/integrate?target=${btn.label.toLowerCase()}`}
                            style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: btn.bg, border: `1px solid ${btn.border}`, color: btn.color, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            {btn.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {summary.decisions.length > 0 && (
                <div className="ms-card">
                  <div className="ms-card-label">Decisions</div>
                  {summary.decisions.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 5 }}>
                      <CheckCircle size={12} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} /> {d}
                    </div>
                  ))}
                </div>
              )}

              <div className="ms-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setShowEmail(v => !v)}>
                  <div className="ms-card-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={10} /> Follow-up Email</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <button onClick={e => { e.stopPropagation(); copyText(summary.followUpEmail, 'email') }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer' }}>
                      {copied === 'email' ? <><CheckCircle size={9} color={C.green} /> Copied</> : <><Copy size={9} /> Copy</>}
                    </button>
                    {showEmail ? <ChevronUp size={13} color={C.muted} /> : <ChevronDown size={13} color={C.muted} />}
                  </div>
                </div>
                {showEmail && (
                  <div style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, marginTop: 10, paddingTop: 10 }}>
                    <pre style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{summary.followUpEmail}</pre>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.muted, cursor: 'pointer', marginTop: 6 }} onClick={() => setShowTranscript(v => !v)}>
                {showTranscript ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showTranscript ? 'Hide' : 'Show'} raw transcript
              </div>
              {showTranscript && (
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: '11px 13px', fontSize: 11, color: C.muted, lineHeight: 1.7, marginTop: 6 }}>{transcript}</div>
              )}
            </div>
          )}
        </div>
      </section>

      <VoiceButton onTranscript={() => {}} color={C.cyan} position="bottom-right" />
    </div>
  )
}
