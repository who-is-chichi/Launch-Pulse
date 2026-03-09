import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';

const SYSTEM_PROMPT = `You are a pharmaceutical launch analytics AI. Given structured insight data for a single insight, write 2-3 sentences of plain-English narrative explaining what happened, why it matters commercially, and what's at stake if left unaddressed. Be grounded strictly in the provided data — do not invent numbers, percentages, or facts not present in the input. Write in a direct, professional tone suited for commercial leadership.

Return only the narrative text. No JSON, no markdown, no headers.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { headline, pillar, severity, confidence, impact, region, drivers, metricChanges, contributors } = body;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: `Generate a plain-English narrative for this insight:\n${JSON.stringify({ headline, pillar, severity, confidence, impact, region, drivers, metricChanges, contributors }, null, 2)}`,
        },
      ],
    });

    const narrative = message.content.find(b => b.type === 'text')?.text?.trim() ?? '';

    return NextResponse.json({ narrative });
  } catch (err) {
    console.error('[ai/insight-narrative]', err);
    const message = err instanceof Error ? err.message : 'Narrative generation failed';
    const isBilling = message.includes('credit balance') || message.includes('billing');
    return NextResponse.json(
      { error: isBilling ? 'AI features require Anthropic API credits. Please add credits at console.anthropic.com.' : message },
      { status: 500 },
    );
  }
}
