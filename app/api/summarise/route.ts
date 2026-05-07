/**
 * POST /api/summarise
 * Body: { transcript: string, vertical?: string }
 * Returns: MeetingSummary JSON
 */
import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export const maxDuration = 60

export interface MeetingSummary {
  title:         string
  date:          string
  duration:      string
  attendees:     string[]
  summary:       string
  actionItems:   { owner: string; task: string; deadline: string }[]
  decisions:     string[]
  followUpEmail: string
}

const SYSTEM = `You are an expert meeting analyst for estate agents and property professionals.
Extract structured information from meeting transcripts. Be specific — names, numbers, addresses, dates.
Always respond with valid JSON only.`

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const transcript: string = (body.transcript ?? '').trim()
  const vertical: string   = body.vertical ?? 'estate agent'

  if (!transcript || transcript.length < 20) {
    return NextResponse.json({ error: 'Transcript too short' }, { status: 400 })
  }

  const prompt = `Meeting transcript from a ${vertical} call:

"""
${transcript.slice(0, 4000)}
"""

Extract and return this JSON structure:
{
  "title": "brief meeting title e.g. 'Oak Street Offer Discussion'",
  "date": "${new Date().toISOString().slice(0, 10)}",
  "duration": "estimated call length",
  "attendees": ["name or role if name unknown"],
  "summary": "2-3 sentence plain English summary of what was discussed",
  "actionItems": [
    { "owner": "person responsible", "task": "specific action", "deadline": "by when or 'ASAP'" }
  ],
  "decisions": ["list of key decisions made"],
  "followUpEmail": "a ready-to-send professional follow-up email summarising the call and next steps. Use \\n for line breaks."
}`

  try {
    const { text } = await callAI(SYSTEM, [{ role: 'user', content: prompt }], 1500, 'balanced')
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    const summary: MeetingSummary = JSON.parse(clean)
    return NextResponse.json(summary)
  } catch (e: any) {
    console.error('[summarise]', e.message)
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 })
  }
}
