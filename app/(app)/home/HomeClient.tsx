'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KPITile from '@/components/KPITile';
import InsightRow from '@/components/InsightRow';
import ActionItem from '@/components/ActionItem';
import DecisionRiskPanel from '@/components/DecisionRiskPanel';
import { Button } from '@/components/ui/button';
import { Download, FileText, Sparkles, Loader2, X } from 'lucide-react';
import { useFilters } from '@/components/FilterContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface KpiTile {
  id: string;
  title: string;
  value: string;
  delta: string;
  deltaType: string;
  sparkline: number[];
  sortOrder: number;
}

interface Insight {
  id: string;
  headline: string;
  pillar: string;
  severity: string;
  impact: string;
  region: string;
  status?: string;
}

interface Action {
  id: string;
  title: string;
  owner: string;
  dueDate: Date | string;
  expectedLag: string;
}

interface Dataset {
  name: string;
  displayName: string;
  freshness: string;
}

interface Driver {
  label: string;
  confidence: number;
}

interface InsightRisk {
  risk: string;
}

interface HomeClientProps {
  brandCode: string;
  dataRunId: string;
  kpiTiles: KpiTile[];
  insights: Insight[];
  actions: Action[];
  datasets: Dataset[];
  drivers: Driver[];
  topInsightRisks: InsightRisk[];
  dataRunAt?: string | null;
  geographyFallback: boolean;
  selectedGeography: string;
}

const PILLAR_COLORS: Record<string, string> = {
  Demand: '#1D4ED8',
  'Start Ops': '#16A34A',
  Execution: '#D97706',
  Structure: '#7C3AED',
};

function computeDriverData(drivers: Driver[]) {
  const pillarMap: Record<string, number> = { Demand: 0, 'Start Ops': 0, Execution: 0, Structure: 0 };
  for (const d of drivers) {
    const lbl = d.label.toLowerCase();
    if (lbl.includes('execution') || lbl.includes('coverage') || lbl.includes('rep') || lbl.includes('call') || lbl.includes('account')) {
      pillarMap['Execution'] += d.confidence;
    } else if (lbl.includes('start ops') || lbl.includes('sp ') || lbl.includes('ttt') || lbl.includes('hub') || lbl.includes('dispense') || lbl.includes('auth') || lbl.includes('outreach') || lbl.includes('backlog') || lbl.includes('resolution')) {
      pillarMap['Start Ops'] += d.confidence;
    } else if (lbl.includes('hcp') || lbl.includes('prescrib') || lbl.includes('adoption') || lbl.includes('demand')) {
      pillarMap['Demand'] += d.confidence;
    } else if (lbl.includes('territory') || lbl.includes('alignment') || lbl.includes('vacancy') || lbl.includes('realignment') || lbl.includes('churn') || lbl.includes('structure')) {
      pillarMap['Structure'] += d.confidence;
    }
    // Labels not matching any pillar are excluded (not bucketed into a wrong pillar)
  }
  const total = Object.values(pillarMap).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(pillarMap)
    .map(([label, val]) => ({
      label,
      value: Math.round((val / total) * 100),
      color: PILLAR_COLORS[label] ?? '#94A3B8',
    }))
    .filter(d => d.value > 0);
}

function freshnessColor(freshness: string) {
  if (freshness === 'Fresh') return '#16A34A';
  if (freshness === 'Lag') return '#D97706';
  return '#DC2626';
}

export default function HomeClient({ brandCode, dataRunId, kpiTiles, insights, actions, datasets, drivers, topInsightRisks, dataRunAt, geographyFallback, selectedGeography }: HomeClientProps) {
  const { geography, searchQuery } = useFilters();
  const [pulseBrief, setPulseBrief] = useState<string | null>(null);
  const [isBriefLoading, setIsBriefLoading] = useState(false);
  const [briefCooldownSecs, setBriefCooldownSecs] = useState(0);
  const lastBriefAt = useRef<Map<string, number>>(new Map());
  const COOLDOWN_MS = 30_000;
  const driverData = computeDriverData(drivers);

  const [orgUsers, setOrgUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => setOrgUsers(data.users ?? []))
      .catch(() => {});
  }, []);

  const [assignInsight, setAssignInsight] = useState<Insight | null>(null);
  const [suggestions, setSuggestions] = useState<{ title: string; expectedLag: string; notes: string }[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState<number | null>(null);
  const [assignForm, setAssignForm] = useState({ title: '', owner: '', dueDate: '', expectedLag: '', notes: '' });
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [localActions, setLocalActions] = useState(actions);

  useEffect(() => {
    if (briefCooldownSecs <= 0) return;
    const timer = setInterval(() => {
      const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - (lastBriefAt.current.get(dataRunId) ?? 0))) / 1000);
      if (remaining <= 0) {
        setBriefCooldownSecs(0);
        clearInterval(timer);
      } else {
        setBriefCooldownSecs(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [briefCooldownSecs]);
  const decisionRisks = topInsightRisks.map(r => r.risk);

  const filteredInsights = insights.filter((insight) => {
    const matchesGeo = geography === 'Nation' || insight.region === geography;
    const matchesSearch =
      !searchQuery ||
      insight.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.pillar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.impact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGeo && matchesSearch;
  });

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handlePulseBrief = async () => {
    const elapsed = Date.now() - (lastBriefAt.current.get(dataRunId) ?? 0);
    if (elapsed < COOLDOWN_MS) {
      setBriefCooldownSecs(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
      return;
    }
    lastBriefAt.current.set(dataRunId, Date.now());
    setBriefCooldownSecs(COOLDOWN_MS / 1000);
    setIsBriefLoading(true);
    setPulseBrief(null);
    try {
      const res = await fetch('/api/ai/pulse-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insights, kpiTiles, drivers, dataRunId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPulseBrief(data.brief);
    } catch (err) {
      logger.error('Pulse brief generation failed', { component: 'HomeClient', error: err instanceof Error ? err.message : err });
      toast.error('Unable to generate pulse brief. Please try again.');
      setPulseBrief('Unable to generate pulse brief. Please try again.');
    } finally {
      setIsBriefLoading(false);
    }
  };

  const handleOpenAssign = (insight: Insight) => {
    setAssignInsight(insight);
    setSuggestions([]);
    setSuggestionsError(null);
    setSelectedSuggestionIdx(null);
    setAssignForm({ title: '', owner: '', dueDate: '', expectedLag: '', notes: '' });
  };

  const handlePopulateWithAI = async () => {
    if (!assignInsight) return;
    setIsSuggestionsLoading(true);
    setSuggestionsError(null);
    setSuggestions([]);
    try {
      const res = await fetch('/api/ai/action-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: assignInsight.headline,
          pillar: assignInsight.pillar,
          severity: assignInsight.severity,
          impact: assignInsight.impact,
          region: assignInsight.region,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSuggestions(data.suggestions);
    } catch (err) {
      setSuggestionsError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  const handleSelectSuggestion = (idx: number) => {
    const s = suggestions[idx];
    setSelectedSuggestionIdx(idx);
    setAssignForm(f => ({ ...f, title: s.title, expectedLag: s.expectedLag, notes: s.notes }));
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignInsight) return;
    setAssignSubmitting(true);
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandCode,
          title: assignForm.title,
          linkedInsight: assignInsight.headline,
          owner: assignForm.owner,
          dueDate: assignForm.dueDate,
          severity: assignInsight.severity,
          expectedLag: assignForm.expectedLag,
          notes: assignForm.notes || null,
          insightId: assignInsight.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create action');
      setLocalActions(prev => [data.action, ...prev]);
      setAssignInsight(null);
      toast.success('Action created successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create action');
    } finally {
      setAssignSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {geographyFallback && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-sm text-[#1D4ED8] flex items-center gap-2">
          <span className="font-medium">Note:</span> No data available for {selectedGeography} — showing Nation-level data.
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-[#0F172A]">Launch Pulse</h1>
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#DBEAFE] to-[#EDE9FE] text-[11px] font-semibold text-[#4338CA]">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Today
            </span>
          </div>
          <p className="text-sm text-[#64748B]">
            Daily strategic shifts across Demand, Start Ops, Execution, and Structure
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const a = document.createElement('a');
              a.href = `/api/export/exec-pack?brand=${encodeURIComponent(brandCode)}&runId=${encodeURIComponent(dataRunId)}`;
              a.download = `exec-pack-${brandCode}.html`;
              a.click();
            }}
          >
            <Download className="w-4 h-4" />
            Export Exec Pack
          </Button>
          {briefCooldownSecs > 0 && !isBriefLoading && (
            <span className="text-[11px] text-[#94A3B8]">Wait {briefCooldownSecs}s</span>
          )}
          <Button className="gap-2" onClick={handlePulseBrief} disabled={isBriefLoading || briefCooldownSecs > 0}>
            {isBriefLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isBriefLoading ? 'Generating...' : 'Generate Pulse Brief'}
          </Button>
        </div>
      </motion.div>

      {/* Pulse Brief Panel */}
      <AnimatePresence>
        {pulseBrief && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-[#E2E8F0] rounded-2xl p-5 relative"
            style={{ boxShadow: 'var(--card-shadow)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-[#0F172A]">Pulse Brief</span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#DBEAFE] to-[#EDE9FE] text-[10px] font-semibold text-[#4338CA] uppercase tracking-wide">AI</span>
            </div>
            <p className="text-sm text-[#334155] leading-relaxed">{pulseBrief}</p>
            <button
              onClick={() => setPulseBrief(null)}
              className="absolute top-4 right-4 text-[#CBD5E1] hover:text-[#64748B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-[#CBD5E1] mt-3">AI-generated from current launch data. Verify before sharing externally.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        {kpiTiles.map((kpi, index) => (
          <KPITile
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            delta={kpi.delta}
            deltaType={kpi.deltaType as 'up' | 'down'}
            sparklineData={kpi.sparkline}
            index={index}
          />
        ))}
      </div>

      {/* Headlines */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Today&apos;s Headlines</h2>
          <span className="text-xs text-[#94A3B8] font-medium">{filteredInsights.length} insights</span>
        </div>
        <div className="space-y-3">
          {filteredInsights.length > 0 ? (
            filteredInsights.map((insight) => (
              <InsightRow
                key={insight.id}
                insight={{
                  id: insight.id,
                  headline: insight.headline,
                  pillar: insight.pillar as 'Demand' | 'Start Ops' | 'Execution' | 'Structure',
                  severity: insight.severity as 'High' | 'Medium' | 'Low',
                  impact: insight.impact,
                  region: insight.region,
                }}
                onAssign={handleOpenAssign}
              />
            ))
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--card-shadow)' }}>
              <p className="text-sm text-[#94A3B8]">No insights match the current filters.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Two-column section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Driver Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">Driver Breakdown</h2>
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="space-y-5">
              {driverData.length > 0 ? driverData.map((driver) => (
                <div key={driver.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#334155]">{driver.label}</span>
                    <span className="text-sm font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{driver.value}%</span>
                  </div>
                  <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${driver.value}%` }}
                      transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ backgroundColor: driver.color }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[#94A3B8] text-center py-4">No driver data yet — run the engine to compute.</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* What to Do Next */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">What to Do Next</h2>
          <div className="space-y-3">
            {localActions.map((action) => (
              <ActionItem
                key={action.id}
                title={action.title}
                owner={action.owner}
                dueDate={formatDate(action.dueDate)}
                expectedLag={action.expectedLag}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Confidence Flags */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <DecisionRiskPanel risks={decisionRisks} />
      </motion.div>

      {/* Data freshness footer */}
      <div className="flex items-center justify-between text-xs pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-4 text-[#94A3B8]">
          <span>Last data drop: <span className="font-semibold text-[#334155]">{dataRunAt ? new Date(dataRunAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : '—'}</span></span>
          <div className="flex items-center gap-3">
            {datasets.map((ds) => (
              <div key={ds.name} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: freshnessColor(ds.freshness) }}></span>
                <span>{ds.displayName}: {ds.freshness}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {assignInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setAssignInsight(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-action-title"
            className="relative bg-white rounded-2xl border border-[#E2E8F0] p-6 w-full max-w-md mx-4 overflow-y-auto max-h-[90vh]"
            style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.15)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 id="assign-action-title" className="text-base font-semibold text-[#0F172A]">Assign Action</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-1">{assignInsight.headline}</p>
              </div>
              <button
                onClick={() => setAssignInsight(null)}
                className="text-[#CBD5E1] hover:text-[#64748B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 mb-4 border-dashed border-[#BFDBFE] text-[#1D4ED8] hover:bg-[#DBEAFE]"
              onClick={handlePopulateWithAI}
              disabled={isSuggestionsLoading}
            >
              {isSuggestionsLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
              {isSuggestionsLoading ? 'Generating suggestions...' : 'Populate with AI'}
            </Button>

            {suggestionsError && (
              <p className="text-xs text-red-500 mb-3">{suggestionsError}</p>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">AI Suggestions — pick one</p>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      selectedSuggestionIdx === idx
                        ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] hover:border-[#93C5FD]'
                    }`}
                  >
                    <span className="font-medium block">{s.title}</span>
                    <span className="text-[11px] text-[#94A3B8]">{s.notes}</span>
                  </button>
                ))}
                <p className="text-[10px] text-[#CBD5E1]">AI-generated. Review before submitting.</p>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                  Action Title <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Increase rep coverage in T12"
                  value={assignForm.title}
                  onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                    Owner <span className="text-red-400">*</span>
                  </label>
                  {orgUsers.length > 0 ? (
                    <select
                      required
                      value={assignForm.owner}
                      onChange={e => setAssignForm(f => ({ ...f, owner: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                    >
                      <option value="">Select owner...</option>
                      {orgUsers.map(u => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}
                    </select>
                  ) : (
                    <input
                      required
                      type="text"
                      placeholder="e.g. Jane Smith"
                      value={assignForm.owner}
                      onChange={e => setAssignForm(f => ({ ...f, owner: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                    />
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                    Due Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={assignForm.dueDate}
                    onChange={e => setAssignForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Expected Lag</label>
                <select
                  value={assignForm.expectedLag}
                  onChange={e => setAssignForm(f => ({ ...f, expectedLag: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#93C5FD] bg-[#F8FAFC] focus:bg-white transition-colors"
                >
                  <option value="">Select lag...</option>
                  <option>Immediate</option>
                  <option>1-2 weeks</option>
                  <option>2-3 weeks</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-[#94A3B8]"
                  onClick={() => setAssignInsight(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={assignSubmitting}>
                  {assignSubmitting ? 'Creating...' : 'Create Action'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
