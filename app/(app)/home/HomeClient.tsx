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
  status: string;
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

export default function HomeClient({ brandCode, dataRunId, kpiTiles, insights, actions, datasets, drivers, topInsightRisks, dataRunAt }: HomeClientProps) {
  const { geography, searchQuery } = useFilters();
  const [pulseBrief, setPulseBrief] = useState<string | null>(null);
  const [isBriefLoading, setIsBriefLoading] = useState(false);
  const [briefCooldownSecs, setBriefCooldownSecs] = useState(0);
  const lastBriefAt = useRef<Map<string, number>>(new Map());
  const COOLDOWN_MS = 30_000;
  const driverData = computeDriverData(drivers);

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
      console.error('[HomeClient pulse-brief]', err);
      setPulseBrief('Unable to generate pulse brief. Please try again.');
    } finally {
      setIsBriefLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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
            {actions.map((action) => (
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
    </div>
  );
}
