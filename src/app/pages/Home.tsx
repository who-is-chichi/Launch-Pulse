import React from 'react';
import { motion } from 'motion/react';
import KPITile from '../components/KPITile';
import InsightRow, { InsightData } from '../components/InsightRow';
import ActionItem from '../components/ActionItem';
import DecisionRiskPanel from '../components/DecisionRiskPanel';
import { Button } from '../components/ui/button';
import { Download, FileText, Sparkles } from 'lucide-react';
import { useFilters } from '../components/FilterContext';

const kpiData = [
  { title: 'Demand Momentum', value: '+8.2%', delta: '+2.3%', deltaType: 'up' as const, sparklineData: [40, 55, 45, 70, 60, 75, 85] },
  { title: 'Time-to-Therapy', value: '12.4d', delta: '+1.2d', deltaType: 'down' as const, sparklineData: [60, 65, 70, 75, 80, 85, 90] },
  { title: 'Execution Coverage', value: '87%', delta: '-3%', deltaType: 'down' as const, sparklineData: [90, 88, 85, 87, 84, 82, 80] },
  { title: 'Structure Integrity', value: '96%', delta: '+1%', deltaType: 'up' as const, sparklineData: [88, 90, 91, 93, 94, 95, 96] },
];

const todaysHeadlines: InsightData[] = [
  {
    id: '1',
    headline: 'NRx down 12% WoW in Northeast; driven by 3 parent systems; not alignment-driven',
    pillar: 'Demand',
    severity: 'High',
    impact: '47 NRx',
    region: 'Northeast',
  },
  {
    id: '2',
    headline: "SP 'Pending Outreach' backlog up 18%; median time-to-first-dispense +3 days",
    pillar: 'Start Ops',
    severity: 'High',
    impact: '134 cases',
    region: 'Nation',
  },
  {
    id: '3',
    headline: 'Coverage down 20% for top-decile Accounts in Territory T12; likely execution gap',
    pillar: 'Execution',
    severity: 'Medium',
    impact: '28 HCPs',
    region: 'Midwest',
  },
  {
    id: '4',
    headline: 'Territory trend shift mostly explained by alignment update; decision risk flagged',
    pillar: 'Structure',
    severity: 'Low',
    impact: 'Information',
    region: 'Southwest',
  },
  {
    id: '5',
    headline: 'Dispense velocity up 22% in West region; correlated with improved SP resolution time',
    pillar: 'Start Ops',
    severity: 'Low',
    impact: '89 dispenses',
    region: 'West',
  },
];

const decisionRisks = [
  'Territory shifts driven by alignment update — use caution when interpreting territory-level trends',
  'Claims feed lag detected (48h) — treat NRx counts cautiously until next data drop',
  'Low confidence in attribution for Northeast demand drop — execution data incomplete',
];

const driverData = [
  { label: 'Execution', value: 42, color: '#D97706' },
  { label: 'Start Ops (SP + Dispense)', value: 31, color: '#16A34A' },
  { label: 'Fulfillment / Channel (Shipments)', value: 18, color: '#1D4ED8' },
  { label: 'Structure (Territory/Affiliation)', value: 9, color: '#7C3AED' },
];

export default function Home() {
  const { geography, searchQuery } = useFilters();

  const filteredHeadlines = todaysHeadlines.filter((insight) => {
    const matchesGeo = geography === 'Nation' || insight.region === geography;
    const matchesSearch = !searchQuery || 
      insight.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.pillar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.impact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGeo && matchesSearch;
  });

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
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Exec Pack
          </Button>
          <Button className="gap-2">
            <FileText className="w-4 h-4" />
            Generate Pulse Brief
          </Button>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <KPITile key={index} {...kpi} index={index} />
        ))}
      </div>

      {/* Headlines */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Today's Headlines</h2>
          <span className="text-xs text-[#94A3B8] font-medium">{filteredHeadlines.length} insights</span>
        </div>
        <div className="space-y-3">
          {filteredHeadlines.length > 0 ? (
            filteredHeadlines.map((insight) => (
              <InsightRow key={insight.id} insight={insight} />
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
          <div
            className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
            style={{ boxShadow: 'var(--card-shadow)' }}
          >
            <div className="space-y-5">
              {driverData.map((driver) => (
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
              ))}
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
            <ActionItem
              title="Deep-dive SP 'Pending Outreach' backlog with hub partner"
              owner="Start Ops Lead"
              dueDate="Mar 8, 2026"
              expectedLag="1-2 weeks"
            />
            <ActionItem
              title="Review T12 call plans and Account prioritization with RSD"
              owner="Regional Director"
              dueDate="Mar 10, 2026"
              expectedLag="2-3 weeks"
            />
            <ActionItem
              title="Validate Northeast parent system drops are not data artifacts"
              owner="Analytics Lead"
              dueDate="Mar 6, 2026"
              expectedLag="Immediate"
            />
          </div>
        </motion.div>
      </div>

      {/* Decision Risk */}
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
          <span>Last data drop: <span className="font-semibold text-[#334155]">2026-03-05 06:10 ET</span></span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
              <span>Claims: Fresh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
              <span>Dispense: Fresh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
              <span>SP: 48h lag</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}