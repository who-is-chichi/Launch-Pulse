'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Download, UserPlus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { hasMinRole } from '@/lib/roles';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { exportInsightsToCsv } from '@/lib/export-csv';

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
  pillar,
  geographyFallback,
  geography,
  userRole = 'sales_rep',
}: {
  initialInsights: Insight[];
  totalCount: number;
  page: number;
  pageSize: number;
  pillar: string;
  geographyFallback: boolean;
  geography: string;
  userRole?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = '/insights';
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { searchQuery, brand, timeWindow } = useFilters();
  const [isRunning, setIsRunning] = useState(false);
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    const current = new URLSearchParams(searchParams.toString());
    const currentBrand = current.get('brand') ?? 'ONC-101';
    const currentTW = current.get('timeWindow') ?? 'Last 7 days';
    // Only navigate if filter state actually changed from what's in URL
    if (currentBrand === brand && currentTW === timeWindow) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('brand', brand);
    params.set('timeWindow', timeWindow);
    params.set('page', '1');
    router.push(`/insights?${params.toString()}`);
  }, [brand, timeWindow]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredInsights = initialInsights.filter((insight) => {
    const matchesSeverity = selectedSeverity === 'all' || insight.severity.toLowerCase() === selectedSeverity;
    const matchesSearch =
      !searchQuery ||
      insight.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.pillar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.impact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
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
      {geographyFallback && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-sm text-[#1D4ED8] flex items-center gap-2">
          <span className="font-medium">Note:</span> No data available for {geography} — showing Nation-level data.
        </div>
      )}
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
          {hasMinRole(userRole, 'analytics_manager') && (
            <Button
              variant="outline"
              className="gap-2"
              disabled={isRunning}
              onClick={async () => {
                setIsRunning(true);
                try {
                  const res = await fetch('/api/engine/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ brandCode: brand }),
                  });
                  if (res.status === 429) {
                    toast.error('Rate limited — try again shortly');
                  } else if (!res.ok) {
                    toast.error('Engine run failed');
                  } else {
                    toast.success('Insights refreshed');
                    router.refresh();
                  }
                } catch {
                  toast.error('Engine run failed');
                } finally {
                  setIsRunning(false);
                }
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running...' : 'Refresh Insights'}
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2"
            disabled={selectedIds.size === 0}
            onClick={() => {
              const toExport = initialInsights.filter(i => selectedIds.has(i.id));
              exportInsightsToCsv(toExport);
            }}
          >
            <Download className="w-4 h-4" />
            {selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export Selected'}
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

        <Select
          value={pillar || 'all'}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== 'all') params.set('pillar', value); else params.delete('pillar');
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="All Pillars" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="all">All Pillars</SelectItem>
            <SelectItem value="Demand">Demand</SelectItem>
            <SelectItem value="Start Ops">Start Ops</SelectItem>
            <SelectItem value="Execution">Execution</SelectItem>
            <SelectItem value="Structure">Structure</SelectItem>
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
          onClick={() => {
            setSelectedSeverity('all');
            const params = new URLSearchParams(searchParams.toString());
            params.delete('pillar');
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="text-[#94A3B8] hover:text-[#334155]"
        >
          Clear Filters
        </Button>
      </div>

      {hasMinRole(userRole, 'executive') && <AISummaryPanel insights={summaryInsights} />}

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
                  <Checkbox
                    checked={filteredInsights.length > 0 && filteredInsights.every(i => selectedIds.has(i.id))}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedIds(new Set(filteredInsights.map(i => i.id)));
                      else setSelectedIds(new Set());
                    }}
                  />
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
                      <Checkbox
                        checked={selectedIds.has(insight.id)}
                        onCheckedChange={(checked) => setSelectedIds(prev => {
                          const next = new Set(prev);
                          checked ? next.add(insight.id) : next.delete(insight.id);
                          return next;
                        })}
                      />
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
