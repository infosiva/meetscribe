import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { messages, system } = await req.json()
    const sysPrompt = system ?? 'You are MeetScribe AI — a meeting productivity expert. Help users take better notes, summarise meetings, create action items, and improve meeting efficiency. Be concise and actionable.'
    const text = await callAI(messages, sysPrompt, 400)
    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ text: 'Start a meeting transcription above!' }, { status: 200 })
  }
}
