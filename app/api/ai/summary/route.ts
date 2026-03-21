import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { checkApiRateLimit } from '@/lib/api-rate-limit';

interface InsightForSummary {
  id: string;
  headline: string;
  pillar: string;
  severity: 'High' | 'Medium' | 'Low';
  confidence: 'High' | 'Medium' | 'Low';
  impact: string;
  region: string;
  status: string;
}

interface PairedItem {
  impact: { label: string; detail: string; severity: 'High' | 'Medium' | 'Low'; pillar: string };
  action: { action: string; rationale: string; urgency: 'Immediate' | 'This Week' | 'Monitor' };
}

interface SummaryData {
  overview: string;
  pairedItems: PairedItem[];
  riskCallout: string | null;
}

const SYSTEM_PROMPT = `You are a pharmaceutical launch analytics AI. You synthesize structured insight data into concise executive summaries.

RULES:
- Use ONLY the data provided in the user message. Do not invent numbers, percentages, metrics, or facts not present in the input.
- Write in a direct, professional tone suited for commercial leadership.
- Return valid JSON matching exactly the schema described below.

OUTPUT SCHEMA:
{
  "overview": string (2-3 sentences summarizing the overall signal landscape),
  "pairedItems": Array of objects, one per pillar present in the data:
    {
      "impact": {
        "label": string (e.g. "Demand Erosion Risk"),
        "detail": string (1-2 sentences grounded in the insight data provided),
        "severity": "High" | "Medium" | "Low",
        "pillar": string
      },
      "action": {
        "action": string (specific recommended action, imperative voice),
        "rationale": string (1-2 sentences explaining why this action, grounded in the data),
        "urgency": "Immediate" | "This Week" | "Monitor"
      }
    },
  "riskCallout": string | null (flag if any high-severity insight has low confidence, else null)
}

Return only the JSON object. No markdown, no code fences, no explanation.`;

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rl = checkApiRateLimit(userId, 'ai');
  if (!rl.allowed) {
    logger.warn('AI rate limit exceeded', { route: 'ai/summary', userId });
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
    const insights: InsightForSummary[] = body.insights ?? [];

    if (insights.length === 0) {
      const empty: SummaryData = {
        overview: 'No insights match the current filters. Adjust your filters to see AI-generated analysis.',
        pairedItems: [],
        riskCallout: null,
      };
      return NextResponse.json(empty);
    }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: `Insights data (${insights.length} insight${insights.length !== 1 ? 's' : ''}):\n${JSON.stringify(insights, null, 2)}`,
        },
      ],
    });

    const raw = message.content.find(b => b.type === 'text')?.text ?? '';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const summary: SummaryData = JSON.parse(text);

    // Hallucination guard: verify AI only referenced pillars present in the input
    const validPillars = new Set(insights.map(i => i.pillar));
    for (const item of summary.pairedItems) {
      if (!validPillars.has(item.impact.pillar)) {
        throw new Error(`AI referenced unknown pillar: ${item.impact.pillar}`);
      }
    }

    return NextResponse.json(summary);
  } catch (err) {
    logger.error('AI summary failed', { route: '[ai/summary]', error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : 'AI summary failed';
    const isBilling = message.includes('credit balance') || message.includes('billing');
    return NextResponse.json(
      { error: isBilling ? 'AI features require Anthropic API credits. Please add credits at console.anthropic.com.' : message },
      { status: 500 },
    );
  }
}
