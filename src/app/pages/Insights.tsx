import React, { useState } from 'react';
import { Link } from 'react-router';
import { Filter, Download, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import PillarTag from '../components/PillarTag';
import SeverityBadge from '../components/SeverityBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useFilters } from '../components/FilterContext';
import AISummaryPanel from '../components/AISummaryPanel';

const insights = [
  {
    id: '1',
    headline: 'NRx down 12% WoW in Northeast; driven by 3 parent systems; not alignment-driven',
    pillar: 'Demand' as const,
    severity: 'High' as const,
    confidence: 'High' as const,
    impact: '47 NRx',
    region: 'Northeast',
    generatedDate: '2026-03-05',
    status: 'New' as const,
  },
  {
    id: '2',
    headline: "SP 'Pending Outreach' backlog up 18%; median time-to-first-dispense +3 days",
    pillar: 'Start Ops' as const,
    severity: 'High' as const,
    confidence: 'Medium' as const,
    impact: '134 cases',
    region: 'Nation',
    generatedDate: '2026-03-05',
    status: 'Investigating' as const,
  },
  {
    id: '3',
    headline: 'Coverage down 20% for top-decile Accounts in Territory T12; likely execution gap',
    pillar: 'Execution' as const,
    severity: 'Medium' as const,
    confidence: 'High' as const,
    impact: '28 HCPs',
    region: 'Midwest',
    generatedDate: '2026-03-05',
    status: 'New' as const,
  },
  {
    id: '4',
    headline: 'Territory trend shift mostly explained by alignment update; decision risk flagged',
    pillar: 'Structure' as const,
    severity: 'Low' as const,
    confidence: 'Low' as const,
    impact: 'Information',
    region: 'Southwest',
    generatedDate: '2026-03-04',
    status: 'Monitoring' as const,
  },
  {
    id: '5',
    headline: 'Dispense velocity up 22% in West region; correlated with improved SP resolution time',
    pillar: 'Start Ops' as const,
    severity: 'Low' as const,
    confidence: 'High' as const,
    impact: '89 dispenses',
    region: 'West',
    generatedDate: '2026-03-05',
    status: 'Actioned' as const,
  },
  {
    id: '6',
    headline: 'New parent system affiliation detected for 12 high-volume HCPs in Midwest',
    pillar: 'Structure' as const,
    severity: 'Medium' as const,
    confidence: 'High' as const,
    impact: '12 HCPs',
    region: 'Midwest',
    generatedDate: '2026-03-04',
    status: 'New' as const,
  },
];

const statusColors = {
  New: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
  Investigating: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  Actioned: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
  Monitoring: 'bg-[#F5F3FF] text-[#5B21B6] border-[#DDD6FE]',
};

export default function Insights() {
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const { geography, searchQuery } = useFilters();

  const filteredInsights = insights.filter((insight) => {
    const matchesPillar = selectedPillar === 'all' || insight.pillar.toLowerCase() === selectedPillar;
    const matchesSeverity = selectedSeverity === 'all' || insight.severity.toLowerCase() === selectedSeverity;
    const matchesGeo = geography === 'Nation' || insight.region === geography;
    const matchesSearch = !searchQuery ||
      insight.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.pillar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.impact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPillar && matchesSeverity && matchesGeo && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] mb-1">Insights</h1>
          <p className="text-sm text-[#64748B]">
            Explore and manage all insights across your launch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Selected
          </Button>
          <Button variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Bulk Assign
          </Button>
        </div>
      </motion.div>

      <div className="flex items-center gap-4 bg-white border border-[#E2E8F0] rounded-2xl px-5 py-3" style={{ boxShadow: 'var(--card-shadow)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
          </div>
          <span className="text-sm font-medium text-[#334155]">Filters:</span>
        </div>
        
        <Select value={selectedPillar} onValueChange={setSelectedPillar}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="All Pillars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pillars</SelectItem>
            <SelectItem value="demand">Demand</SelectItem>
            <SelectItem value="start ops">Start Ops</SelectItem>
            <SelectItem value="execution">Execution</SelectItem>
            <SelectItem value="structure">Structure</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="All Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={() => {
          setSelectedPillar('all');
          setSelectedSeverity('all');
        }} className="text-[#94A3B8] hover:text-[#334155]">
          Clear Filters
        </Button>
      </div>

      {/* AI Summary Panel */}
      <AISummaryPanel insights={filteredInsights} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: 'var(--card-shadow)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  <input type="checkbox" className="rounded border-[#CBD5E1]" />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Headline
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Pillar
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Region
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredInsights.length > 0 ? (
                filteredInsights.map((insight) => (
                <tr key={insight.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-4">
                    <input type="checkbox" className="rounded border-[#CBD5E1]" />
                  </td>
                  <td className="px-4 py-4">
                    <Link 
                      to={`/insights/${insight.id}`}
                      className="text-sm text-[#0F172A] hover:text-[#1D4ED8] font-medium transition-colors"
                    >
                      {insight.headline}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <PillarTag pillar={insight.pillar} />
                  </td>
                  <td className="px-4 py-4">
                    <SeverityBadge severity={insight.severity} />
                  </td>
                  <td className="px-4 py-4 text-sm text-[#334155] font-medium">
                    {insight.impact}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#64748B]">
                    {insight.region}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#94A3B8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {insight.generatedDate}
                  </td>
                  <td className="px-4 py-4">
                    <Badge className={`rounded-full border text-[11px] font-semibold ${statusColors[insight.status]}`}>
                      {insight.status}
                    </Badge>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-[#94A3B8]">
                    No insights match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="flex items-center justify-between text-sm text-[#94A3B8]">
        <span>Showing {filteredInsights.length} of {insights.length} insights</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="rounded-xl">Previous</Button>
          <Button variant="outline" size="sm" className="rounded-xl">Next</Button>
        </div>
      </div>
    </div>
  );
}