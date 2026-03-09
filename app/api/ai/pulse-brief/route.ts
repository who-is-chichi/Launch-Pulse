import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';

const SYSTEM_PROMPT = `You are a pharmaceutical launch analytics AI writing a concise executive pulse brief for commercial leadership.

RULES:
- Use ONLY the structured data provided. Do not invent numbers, percentages, metrics, or facts not present in the input.
- Write in flowing prose, present tense, 150–200 words.
- Cover: top KPI movements, the highest-severity insight headline, the primary driver signal, and one recommended action priority.
- No bullet points. No headers. No markdown. Plain prose paragraph(s).
- End with a clear, single recommended action for the team this week.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { insights = [], kpiTiles = [], drivers = [] } = body;

    const inputData = { insights, kpiTiles, drivers };

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: `Generate a pulse brief from the following launch data:\n${JSON.stringify(inputData, null, 2)}`,
        },
      ],
    });

    const brief = message.content.find(b => b.type === 'text')?.text ?? '';

    // Hallucination guard: warn if brief references numbers not found in input
    const inputStr = JSON.stringify(inputData);
    const briefNumbers = brief.match(/\d+\.?\d*/g) ?? [];
    for (const num of briefNumbers) {
      if (!inputStr.includes(num)) {
        console.warn(`[ai/pulse-brief] Possible hallucinated number: ${num}`);
      }
    }

    return NextResponse.json({ brief });
  } catch (err) {
    console.error('[ai/pulse-brief]', err);
    const message = err instanceof Error ? err.message : 'Pulse brief generation failed';
    const isBilling = message.includes('credit balance') || message.includes('billing');
    return NextResponse.json(
      { error: isBilling ? 'AI features require Anthropic API credits. Please add credits at console.anthropic.com.' : message },
      { status: 500 },
    );
  }
}
