import { NextRequest, NextResponse } from 'next/server';
import { callA0LLM, type Message } from '@/lib/a0llm';

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const completion = await callA0LLM(messages);

    return NextResponse.json({ completion });
  } catch (error) {
    console.error('LLM API error:', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}