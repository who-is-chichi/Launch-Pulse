'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Zap,
  Brain,
  RefreshCw,
  MoveRight,
} from 'lucide-react';
import { Button } from './ui/button';
import SeverityBadge from './SeverityBadge';

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

interface AISummaryPanelProps {
  insights: InsightForSummary[];
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

const pillarIcons: Record<string, { bg: string; border: string; text: string }> = {
  Demand: { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', text: 'text-[#1E40AF]' },
  'Start Ops': { bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0]', text: 'text-[#166534]' },
  Execution: { bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A]', text: 'text-[#92400E]' },
  Structure: { bg: 'bg-[#F5F3FF]', border: 'border-[#DDD6FE]', text: 'text-[#5B21B6]' },
};

const urgencyStyles = {
  Immediate: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#991B1B]',
    border: 'border-[#FECACA]',
    dot: 'bg-[#DC2626]',
  },
  'This Week': {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#92400E]',
    border: 'border-[#FDE68A]',
    dot: 'bg-[#D97706]',
  },
  Monitor: {
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#166534]',
    border: 'border-[#BBF7D0]',
    dot: 'bg-[#16A34A]',
  },
};

export default function AISummaryPanel({ insights }: AISummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSecs, setCooldownSecs] = useState(0);
  const lastRegenAt = useRef<number>(0);
  const COOLDOWN_MS = 30_000;

  useEffect(() => {
    if (cooldownSecs <= 0) return;
    const timer = setInterval(() => {
      const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRegenAt.current)) / 1000);
      if (remaining <= 0) {
        setCooldownSecs(0);
        clearInterval(timer);
      } else {
        setCooldownSecs(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSecs]);

  const fetchSummary = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insights }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSummary(data as SummaryData);
    } catch (err) {
      console.error('[AISummaryPanel]', err);
      setError('Unable to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [insights]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const displaySummary = summary ?? {
    overview: error ?? 'Generating summary...',
    pairedItems: [],
    riskCallout: null,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(29,78,216,0.03) 0%, rgba(124,58,237,0.03) 50%, rgba(14,165,233,0.03) 100%)',
      }}
    >
      {/* Gradient border effect */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          padding: '1px',
          background: 'linear-gradient(135deg, #93C5FD 0%, #C4B5FD 40%, #7DD3FC 100%)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />

      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0F172A]">AI Insight Summary</h3>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#DBEAFE] to-[#EDE9FE] text-[10px] font-semibold text-[#4338CA] tracking-wide uppercase">
                  Beta
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Synthesized from {insights.length} insight{insights.length !== 1 ? 's' : ''}{' '}
                matching current filters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cooldownSecs > 0 && (
              <span className="text-[11px] text-[#94A3B8]">Wait {cooldownSecs}s</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const elapsed = Date.now() - lastRegenAt.current;
                if (elapsed < COOLDOWN_MS) {
                  setCooldownSecs(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
                  return;
                }
                lastRegenAt.current = Date.now();
                setCooldownSecs(COOLDOWN_MS / 1000);
                fetchSummary();
              }}
              disabled={isGenerating || cooldownSecs > 0}
              className="gap-1.5 text-[#64748B] hover:text-[#334155] text-[11px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#64748B] hover:text-[#334155]"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {isGenerating ? (
              <div className="px-6 pb-6">
                <div className="flex items-center gap-3 py-8 justify-center">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[#7C3AED] animate-pulse" />
                    <span className="text-sm text-[#64748B]">
                      Analyzing insights and generating summary...
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 pb-6 space-y-5">
                {/* Overview */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/80">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-[#1D4ED8] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#334155] leading-relaxed">{displaySummary.overview}</p>
                  </div>
                </div>

                {/* Column headers */}
                {displaySummary.pairedItems.length > 0 && (
                  <div className="grid grid-cols-[1fr_32px_1fr] gap-0 items-end px-1">
                    <div className="flex items-center gap-2 pb-2">
                      <Target className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                        Impact Analysis
                      </h4>
                    </div>
                    <div />
                    <div className="flex items-center gap-2 pb-2">
                      <Zap className="w-3.5 h-3.5 text-[#D97706]" />
                      <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                        Next Best Action
                      </h4>
                    </div>
                  </div>
                )}

                {/* Paired rows: Impact ↔ NBA */}
                {displaySummary.pairedItems.map((pair, index) => {
                  const style = urgencyStyles[pair.action.urgency] ?? urgencyStyles['This Week'];
                  const pillarStyle = pillarIcons[pair.impact.pillar] ?? pillarIcons.Demand;

                  return (
                    <motion.div
                      key={pair.impact.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 + index * 0.1 }}
                      className="grid grid-cols-[1fr_32px_1fr] gap-0 items-stretch"
                    >
                      {/* Impact Card */}
                      <div className="bg-white rounded-xl border border-[#E2E8F0]/80 p-5 flex flex-col" style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold ${pillarStyle.bg} ${pillarStyle.text} ${pillarStyle.border} border`}
                            >
                              {index + 1}
                            </span>
                            <span className="text-[13px] font-semibold text-[#0F172A]">
                              {pair.impact.label}
                            </span>
                          </div>
                          <SeverityBadge severity={pair.impact.severity} />
                        </div>
                        <p className="text-[12px] text-[#64748B] leading-relaxed flex-1">
                          {pair.impact.detail}
                        </p>
                        <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${pillarStyle.bg} ${pillarStyle.text} ${pillarStyle.border} border`}
                          >
                            {pair.impact.pillar}
                          </span>
                        </div>
                      </div>

                      {/* Connector arrow */}
                      <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-px h-6 bg-gradient-to-b from-transparent via-[#CBD5E1] to-transparent" />
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{
                              background:
                                'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                              boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
                            }}
                          >
                            <MoveRight className="w-3.5 h-3.5 text-[#64748B]" />
                          </div>
                          <div className="w-px h-6 bg-gradient-to-b from-transparent via-[#CBD5E1] to-transparent" />
                        </div>
                      </div>

                      {/* NBA Card */}
                      <div className="bg-white rounded-xl border border-[#E2E8F0]/80 p-5 flex flex-col" style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]"
                            >
                              {index + 1}
                            </span>
                            <span className="text-[13px] font-semibold text-[#0F172A]">
                              Recommended Action
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {pair.action.urgency}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 mb-2">
                          <ArrowRight className="w-3.5 h-3.5 text-[#1D4ED8] mt-0.5 flex-shrink-0" />
                          <p className="text-[13px] font-medium text-[#0F172A] leading-snug">
                            {pair.action.action}
                          </p>
                        </div>
                        <p className="text-[12px] text-[#64748B] leading-relaxed flex-1 pl-5.5">
                          {pair.action.rationale}
                        </p>
                        <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
                          <button className="text-[11px] font-semibold text-[#1D4ED8] hover:text-[#1E40AF] transition-colors flex items-center gap-1">
                            Create Action Item
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {displaySummary.pairedItems.length === 0 && (
                  <div className="bg-white/50 rounded-xl p-6 border border-white/60 text-center">
                    <p className="text-[12px] text-[#94A3B8]">
                      No impact data available for current selection.
                    </p>
                  </div>
                )}

                {/* Risk Callout */}
                {displaySummary.riskCallout && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="flex items-start gap-3 bg-[#FFFBEB]/60 backdrop-blur-sm rounded-xl p-4 border border-[#FDE68A]/50"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-semibold text-[#92400E] uppercase tracking-wider">
                        Decision Risk
                      </span>
                      <p className="text-[12px] text-[#92400E]/80 mt-1 leading-relaxed">
                        {displaySummary.riskCallout}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Disclaimer */}
                <div className="flex items-center justify-center pt-1">
                  <p className="text-[10px] text-[#CBD5E1]">
                    AI-generated summary based on current insight data. Verify recommendations
                    before taking action.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
