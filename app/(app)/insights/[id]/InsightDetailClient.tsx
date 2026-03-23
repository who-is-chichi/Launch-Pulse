'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, Download, UserPlus, TrendingDown, TrendingUp, Sparkles, Brain } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import PillarTag from '@/components/PillarTag';
import SeverityBadge from '@/components/SeverityBadge';
import ActionItem from '@/components/ActionItem';
import DecisionRiskPanel from '@/components/DecisionRiskPanel';
import CreateActionModal from '@/components/CreateActionModal';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFilters } from '@/components/FilterContext';
import { INSIGHT_STATUSES } from '@/lib/severity';
import { hasMinRole } from '@/lib/roles';
import { toast } from 'sonner';

interface Driver { label: string; confidence: number; description: string; }
interface MetricChange { metric: string; before: string; after: string; change: string; changePercent: string; direction: string; }
interface Contributor { entity: string; type: string; impact: string; percent: string; }
interface InsightRisk { risk: string; }
interface Action { id: string; title: string; owner: string; dueDate: Date | string; expectedLag: string; linkedInsight: string; }

interface InsightDetailProps {
  insight: {
    id: string;
    headline: string;
    pillar: string;
    severity: string;
    confidence: string;
    impact: string;
    region: string;
    status: string;
    notes?: string | null;
    generatedDate: Date | string;
    drivers: Driver[];
    metricChanges: MetricChange[];
    contributors: Contributor[];
    risks: InsightRisk[];
    actions: Action[];
  };
}

const PILLAR_SOURCES: Record<string, string[]> = {
  Demand: ['Claims'],
  'Start Ops': ['SP Cases'],
  Execution: ['Call Data', 'Claims'],
  Structure: ['Territory Data'],
};

function AIInsightNarrative({ insight }: InsightDetailProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsGenerating(true);
    fetch('/api/ai/insight-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline: insight.headline,
        pillar: insight.pillar,
        severity: insight.severity,
        confidence: insight.confidence,
        impact: insight.impact,
        region: insight.region,
        drivers: insight.drivers,
        metricChanges: insight.metricChanges,
        contributors: insight.contributors,
      }),
    })
      .then(async r => {
        const data = await r.json();
        if (r.status === 429) setError('Rate limited — try again in a moment');
        else if (!r.ok || data.error) setError(data.error ?? `HTTP ${r.status}`);
        else setNarrative(data.narrative);
      })
      .catch(() => setError('Unable to generate narrative.'))
      .finally(() => setIsGenerating(false));
  }, [insight.headline, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(29,78,216,0.03) 0%, rgba(124,58,237,0.03) 50%, rgba(14,165,233,0.03) 100%)',
      }}
    >
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
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#0F172A]">AI Interpretation</span>
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#DBEAFE] to-[#EDE9FE] text-[10px] font-semibold text-[#4338CA] tracking-wide uppercase">Beta</span>
          </div>
        </div>
        {isGenerating ? (
          <div className="flex items-center gap-3 py-2">
            <Brain className="w-4 h-4 text-[#7C3AED] animate-pulse flex-shrink-0" />
            <span className="text-sm text-[#64748B]">Generating narrative...</span>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div>
            <p className="text-sm text-[#334155] leading-relaxed bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/80">
              {error}
            </p>
            <button
              onClick={() => { setError(null); setRetryCount(c => c + 1); }}
              className="mt-2 text-xs text-[#1D4ED8] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#334155] leading-relaxed bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/80">
            {narrative ?? ''}
          </p>
        )}
        <p className="text-[10px] text-[#CBD5E1] mt-3">AI-generated interpretation. Verify before taking action.</p>
      </div>
    </motion.div>
  );
}


const statusColors: Record<string, string> = {
  New: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
  Investigating: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  Actioned: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
  Monitoring: 'bg-[#F5F3FF] text-[#5B21B6] border-[#DDD6FE]',
};

function exportInsightSlide(insight: InsightDetailProps['insight']) {
  const metricRows = insight.metricChanges.map(m =>
    `<tr><td>${m.metric}</td><td>${m.before}</td><td>${m.after}</td><td style="color:${m.direction==='up'?'#16A34A':'#DC2626'}">${m.changePercent}</td></tr>`
  ).join('');
  const driverList = insight.drivers.slice(0, 3).map(d =>
    `<li><strong>${d.label}</strong> — ${d.description} (${d.confidence}% confidence)</li>`
  ).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${insight.headline}</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;color:#0F172A;padding:0 20px}
h1{font-size:1.5rem;margin-bottom:4px}
.meta{display:flex;gap:12px;margin-bottom:24px;font-size:.875rem;color:#64748B}
table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #E2E8F0}
th{font-size:.75rem;text-transform:uppercase;color:#94A3B8}
ul{margin:12px 0;padding-left:20px}li{margin-bottom:8px}
.section{margin-bottom:28px}.section h2{font-size:1rem;font-weight:600;margin-bottom:12px;color:#1E40AF}
.footer{margin-top:40px;font-size:.75rem;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:12px}
</style></head><body>
<h1>${insight.headline}</h1>
<div class="meta"><span>Pillar: ${insight.pillar}</span><span>Severity: ${insight.severity}</span><span>Region: ${insight.region}</span><span>Generated: ${new Date(insight.generatedDate).toLocaleDateString()}</span></div>
<div class="section"><h2>Impact</h2><p>${insight.impact}</p></div>
${metricRows ? `<div class="section"><h2>Metric Changes</h2><table><thead><tr><th>Metric</th><th>Before</th><th>After</th><th>Change</th></tr></thead><tbody>${metricRows}</tbody></table></div>` : ''}
${driverList ? `<div class="section"><h2>Key Drivers</h2><ul>${driverList}</ul></div>` : ''}
<div class="footer">Exported from Launch Pulse · ${new Date().toLocaleDateString()}</div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `insight-${insight.id}-slide.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InsightDetailClient({
  insight,
  brandCode,
  userRole = 'sales_rep',
}: InsightDetailProps & { brandCode: string; userRole?: string }) {
  const { brand } = useFilters();
  const [currentStatus, setCurrentStatus] = useState(insight.status);
  const [notesValue, setNotesValue] = useState(insight.notes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    const previousStatus = currentStatus;
    setCurrentStatus(newStatus);
    try {
      const res = await fetch(`/api/insights/${insight.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, brandCode }),
      });
      if (!res.ok) {
        setCurrentStatus(previousStatus);
        toast.error('Failed to update status');
      } else {
        toast.success('Status updated');
      }
    } catch {
      setCurrentStatus(previousStatus);
      toast.error('Failed to update status');
    }
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <Link href="/insights">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="text-xs text-[#94A3B8] font-medium mb-1 uppercase tracking-wider">Insight Detail</div>
          <h1 className="text-xl font-semibold text-[#0F172A]">{insight.headline}</h1>
        </div>
        <div className="flex items-center gap-2">
          {hasMinRole(userRole, 'regional_director') && (
            <Button variant="outline" className="gap-2" onClick={() => setShowActionModal(true)}>
              <UserPlus className="w-4 h-4" />
              Assign
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => exportInsightSlide(insight)}>
            <Download className="w-4 h-4" />
            Export Slide
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </motion.div>

      <div className="flex items-center gap-3">
        <PillarTag pillar={insight.pillar as 'Demand' | 'Start Ops' | 'Execution' | 'Structure'} />
        <SeverityBadge severity={insight.severity as 'High' | 'Medium' | 'Low'} showIcon />
        <select
          value={currentStatus}
          onChange={e => handleStatusChange(e.target.value)}
          className={`rounded-full border text-[11px] font-semibold px-2.5 py-0.5 cursor-pointer appearance-none focus:outline-none ${statusColors[currentStatus] ?? ''}`}
        >
          {INSIGHT_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-xs text-[#94A3B8]">Generated: {formatDate(insight.generatedDate)}</span>
      </div>

      {/* What Changed */}
      {insight.metricChanges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">What Changed</h2>
          <div className="grid grid-cols-3 gap-4">
            {insight.metricChanges.map((item) => (
              <div key={item.metric} className="border border-[#F1F5F9] rounded-xl p-4 bg-[#FAFBFC]">
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">{item.metric}</div>
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <div className="text-[10px] text-[#94A3B8] uppercase">Before</div>
                    <div className="text-xl font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.before}</div>
                  </div>
                  <div className="text-[#CBD5E1] text-lg">→</div>
                  <div>
                    <div className="text-[10px] text-[#94A3B8] uppercase">After</div>
                    <div className="text-xl font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.after}</div>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${item.direction === 'down' ? 'text-[#DC2626] bg-[#FEF2F2]' : 'text-[#16A34A] bg-[#F0FDF4]'}`}>
                  {item.direction === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  <span>{item.change} ({item.changePercent})</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Where It Changed */}
      {insight.contributors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">Where It Changed</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Entity</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Impact</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {insight.contributors.map((item, index) => (
                  <tr key={index} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3.5 text-sm font-medium text-[#0F172A]">{item.entity}</td>
                    <td className="px-4 py-3.5 text-sm text-[#64748B]">{item.type}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-[#DC2626]">{item.impact}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#DC2626] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: item.percent }}
                            transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-[#334155] min-w-[3rem]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.percent}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Why It Changed */}
      {insight.drivers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6"
          style={{ boxShadow: 'var(--card-shadow)' }}
        >
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">Why It Changed (Driver Hypothesis)</h2>
          <div className="space-y-4">
            {insight.drivers.map((item, index) => (
              <div key={index} className="border border-[#F1F5F9] rounded-xl p-5 bg-[#FAFBFC]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-[#0F172A]">{item.label}</h4>
                  <Badge variant="outline" className="rounded-full font-semibold text-[11px]">
                    {item.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-[#64748B] mb-3">{item.description}</p>
                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${item.confidence > 70 ? 'bg-[#16A34A]' : item.confidence > 40 ? 'bg-[#D97706]' : 'bg-[#CBD5E1]'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.confidence}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Confidence Flags */}
      {insight.risks.length > 0 && (
        <DecisionRiskPanel risks={insight.risks.map((r) => r.risk)} />
      )}

      {/* AI Interpretation */}
      <AIInsightNarrative insight={insight} />

      {/* Evidence */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">Evidence</h2>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-8 flex items-center justify-center">
          <div className="text-center text-[#94A3B8]">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-sm">Trend charts and detailed analytics</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider">Data sources:</span>
          {[...new Set([...(PILLAR_SOURCES[insight.pillar] ?? []), ...insight.metricChanges.map(m => m.metric)])].map((source) => (
            <Badge key={source} variant="outline" className="rounded-full text-[11px]">
              {source}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Recommended Actions</h2>
          <Button size="sm" className="gap-1.5" onClick={() => setShowActionModal(true)}>
            Create Action Item
          </Button>
        </div>
        {insight.actions.length > 0 ? (
          <div className="space-y-3">
            {insight.actions.map((action) => (
              <ActionItem
                key={action.id}
                title={action.title}
                owner={action.owner}
                dueDate={new Date(action.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                expectedLag={action.expectedLag}
                linkedInsight={action.linkedInsight}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#94A3B8]">No actions yet — create one to track follow-up.</p>
        )}
      </div>

      {/* Notes & Decisions */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
        <h2 className="text-base font-semibold text-[#0F172A] mb-4">Notes & Decisions</h2>
        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="mt-4">
            <div className="mt-4">
              <textarea
                placeholder="Add a note or decision..."
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                rows={3}
                value={notesValue}
                onChange={e => setNotesValue(e.target.value)}
              />
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" onClick={async () => {
                  try {
                    const res = await fetch(`/api/insights/${insight.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ notes: notesValue, brandCode }),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    setNotesSaved(true);
                    setTimeout(() => setNotesSaved(false), 2000);
                    toast.success('Notes saved');
                  } catch {
                    toast.error('Failed to save notes');
                  }
                }}>Save Notes</Button>
                {notesSaved && <span className="text-xs text-[#16A34A]">Saved</span>}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="discussion" className="mt-4">
            <p className="text-sm text-[#94A3B8]">No discussions yet.</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Action Modal */}
      <CreateActionModal
        open={showActionModal}
        onClose={() => setShowActionModal(false)}
        brandCode={brand || brandCode}
        prefill={{
          severity: insight.severity as 'High' | 'Medium' | 'Low',
          linkedInsight: insight.headline,
          insightId: insight.id,
        }}
        onSuccess={() => setShowActionModal(false)}
      />
    </div>
  );
}
