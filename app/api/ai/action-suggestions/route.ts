import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { checkApiRateLimit } from '@/lib/api-rate-limit';

const SYSTEM_PROMPT = `You are a pharmaceutical commercial strategy AI.
Given a single launch insight, generate 2-3 concrete, specific action suggestions for the commercial team.

RULES:
- Base every suggestion strictly on the provided insight data. Do not invent facts, metrics, or context not present in the input.
- Each suggestion must be actionable by a named role within 2-4 weeks.
- Return ONLY a valid JSON array. No markdown fences, no prose, no keys outside the array.
- Each element must have exactly three keys:
    "title"       — imperative verb phrase, max 12 words
    "expectedLag" — one of: "Immediate", "1-2 weeks", "2-3 weeks"
    "notes"       — one sentence of rationale grounded in the insight`;

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rl = checkApiRateLimit(userId, 'ai');
  if (!rl.allowed) {
    logger.warn('AI rate limit exceeded', { route: 'ai/action-suggestions', userId });
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      {
        status: 429,
        headers: rl.retryAfterSeconds ? { 'Retry-After': String(rl.retryAfterSeconds) } : undefined,
      },
    );
  }

  try {
    const body = await request.json();
    const { headline, pillar, severity, impact, region } = body;

    const inputData = { headline, pillar, severity, impact, region };
    const inputStr = JSON.stringify(inputData);

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: `Generate action suggestions for this insight:\n${JSON.stringify(inputData, null, 2)}`,
        },
      ],
    });

    const rawText = message.content.find(b => b.type === 'text')?.text ?? '';

    let parsed: unknown;
    try {
      const cleanText = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      parsed = JSON.parse(cleanText);
    } catch {
      logger.warn('action-suggestions: AI returned unparseable response', { route: 'ai/action-suggestions', userId });
      return NextResponse.json({ error: 'AI returned an unparseable response. Please try again.' }, { status: 502 });
    }

    // Validate: must be array with 1-3 elements, each having title, expectedLag, notes string keys
    if (
      !Array.isArray(parsed) ||
      parsed.length < 1 ||
      parsed.length > 3 ||
      !parsed.every(
        (item) =>
          item !== null &&
          typeof item === 'object' &&
          typeof (item as Record<string, unknown>).title === 'string' &&
          typeof (item as Record<string, unknown>).expectedLag === 'string' &&
          typeof (item as Record<string, unknown>).notes === 'string',
      )
    ) {
      logger.warn('action-suggestions: AI response failed validation', { route: 'ai/action-suggestions', userId });
      return NextResponse.json({ error: 'AI returned an unparseable response. Please try again.' }, { status: 502 });
    }

    // Hallucination guard: warn if suggestions reference numbers not found in input
    const suggestionsStr = JSON.stringify(parsed);
    const suggestionNumbers = suggestionsStr.match(/\d+\.?\d*/g) ?? [];
    for (const num of suggestionNumbers) {
      if (!inputStr.includes(num)) {
        logger.warn('Possible hallucinated number in action-suggestions', { route: 'ai/action-suggestions', number: num });
      }
    }

    logger.info('action-suggestions generated', { userId, count: (parsed as unknown[]).length });
    return NextResponse.json({ suggestions: parsed });
  } catch (err) {
    logger.error('ai/action-suggestions failed', { route: 'ai/action-suggestions', error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : 'Action suggestions generation failed';
    const isBilling = message.includes('credit balance') || message.includes('billing');
    return NextResponse.json(
      { error: isBilling ? 'AI features require Anthropic API credits. Please add credits at console.anthropic.com.' : message },
      { status: 500 },
    );
  }
}
