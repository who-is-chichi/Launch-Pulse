'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Download, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import PillarTag from '@/components/PillarTag';
import SeverityBadge from '@/components/SeverityBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFilters } from '@/components/FilterContext';
import AISummaryPanel from '@/components/AISummaryPanel';

interface Insight {
  id: string;
  headline: string;
  pillar: string;
  severity: string;
  confidence: string;
  impact: string;
  region: string;
  generatedDate: Date | string;
  status: string;
}

const statusColors: Record<string, string> = {
  New: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
  Investigating: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  Actioned: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
  Monitoring: 'bg-[#F5F3FF] text-[#5B21B6] border-[#DDD6FE]',
};

export default function InsightsClient({
  initialInsights,
  totalCount,
  page,
  pageSize,
}: {
  initialInsights: Insight[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const { geography, searchQuery } = useFilters();
  const totalPages = Math.ceil(totalCount / pageSize);

  const filteredInsights = initialInsights.filter((insight) => {
    const matchesPillar = selectedPillar === 'all' || insight.pillar.toLowerCase() === selectedPillar;
    const matchesSeverity = selectedSeverity === 'all' || insight.severity.toLowerCase() === selectedSeverity;
    const matchesGeo = geography === 'Nation' || insight.region === geography;
    const matchesSearch =
      !searchQuery ||
      insight.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.pillar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.impact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPillar && matchesSeverity && matchesGeo && matchesSearch;
  });

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // Map to AISummaryPanel shape — use full unfiltered set so AI summary
  // doesn't regenerate on every filter change
  const summaryInsights = initialInsights.map((i) => ({
    id: i.id,
    headline: i.headline,
    pillar: i.pillar,
    severity: i.severity as 'High' | 'Medium' | 'Low',
    confidence: (i.confidence || 'Medium') as 'High' | 'Medium' | 'Low',
    impact: i.impact,
    region: i.region,
    status: i.status,
  }));

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
          <p className="text-sm text-[#64748B]">Explore and manage all insights across your launch</p>
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
          <SelectContent position="popper" sideOffset={4}>
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
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSelectedPillar('all'); setSelectedSeverity('all'); }}
          className="text-[#94A3B8] hover:text-[#334155]"
        >
          Clear Filters
        </Button>
      </div>

      <AISummaryPanel insights={summaryInsights} />

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
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Headline</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Pillar</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Impact</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Region</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
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
                        href={`/insights/${insight.id}`}
                        className="text-sm text-[#0F172A] hover:text-[#1D4ED8] font-medium transition-colors"
                      >
                        {insight.headline}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <PillarTag pillar={insight.pillar as 'Demand' | 'Start Ops' | 'Execution' | 'Structure'} />
                    </td>
                    <td className="px-4 py-4">
                      <SeverityBadge severity={insight.severity as 'High' | 'Medium' | 'Low'} />
                    </td>
                    <td className="px-4 py-4 text-sm text-[#334155] font-medium">{insight.impact}</td>
                    <td className="px-4 py-4 text-sm text-[#64748B]">{insight.region}</td>
                    <td className="px-4 py-4 text-sm text-[#94A3B8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatDate(insight.generatedDate)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={`rounded-full border text-[11px] font-semibold ${statusColors[insight.status] ?? ''}`}>
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
        <span>
          Showing {filteredInsights.length} of {initialInsights.length} on this page
          {totalPages > 1 && ` (page ${page} of ${totalPages}, ${totalCount} total)`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', String(page - 1));
              router.push(`/insights?${params.toString()}`);
            }}
            className="rounded-xl"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', String(page + 1));
              router.push(`/insights?${params.toString()}`);
            }}
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
