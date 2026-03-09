'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, UserPlus } from 'lucide-react';
import PillarTag from './PillarTag';
import SeverityBadge from './SeverityBadge';
import { Button } from './ui/button';

export interface InsightData {
  id: string;
  headline: string;
  pillar: 'Demand' | 'Start Ops' | 'Execution' | 'Structure';
  severity: 'High' | 'Medium' | 'Low';
  impact: string;
  region: string;
  generatedDate?: string;
  status?: 'New' | 'Investigating' | 'Actioned' | 'Monitoring';
}

interface InsightRowProps {
  insight: InsightData;
  showActions?: boolean;
  onClick?: () => void;
}

export default function InsightRow({ insight, showActions = true, onClick }: InsightRowProps) {
  return (
    <div 
      className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--card-shadow)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';
      }}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <h4 className="text-sm font-medium text-[#0F172A] flex-1 leading-relaxed">{insight.headline}</h4>
            <PillarTag pillar={insight.pillar} />
          </div>
          
          <div className="flex items-center gap-2.5 text-xs flex-wrap">
            <SeverityBadge severity={insight.severity} />
            <span className="w-px h-4 bg-[#E2E8F0]" />
            <span className="px-2.5 py-1 bg-[#F1F5F9] text-[#334155] font-medium rounded-lg">{insight.region}</span>
            <span className="text-[#94A3B8]">Impact: <span className="font-semibold text-[#0F172A]">{insight.impact}</span></span>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[#64748B] hover:text-[#1D4ED8] hover:bg-[#DBEAFE] rounded-lg">
              <UserPlus className="w-3.5 h-3.5" />
              Assign
            </Button>
            <Link href={`/insights/${insight.id}`}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-[#64748B] hover:text-[#1D4ED8] hover:bg-[#DBEAFE] rounded-lg">
                <ExternalLink className="w-3.5 h-3.5" />
                View
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}