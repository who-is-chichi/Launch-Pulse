'use client';

import React from 'react';
import { Target, Clock, User, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface ActionItemProps {
  title: string;
  owner: string;
  dueDate: string;
  expectedLag?: string;
  linkedInsight?: string;
}

export default function ActionItem({ title, owner, dueDate, expectedLag, linkedInsight }: ActionItemProps) {
  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--card-shadow)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)',
            boxShadow: '0 1px 3px rgba(29, 78, 216, 0.1)',
          }}
        >
          <Target className="w-4 h-4 text-[#1D4ED8]" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-[#0F172A] mb-1.5 leading-relaxed">{title}</h4>
          {linkedInsight && (
            <p className="text-[11px] text-[#94A3B8]">Linked: {linkedInsight}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-[#94A3B8]">
          <User className="w-3.5 h-3.5" />
          <span className="font-medium text-[#334155]">{owner}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#94A3B8]">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium text-[#334155]">{dueDate}</span>
        </div>
        {expectedLag && (
          <span className="px-2 py-0.5 bg-[#FFEDD5] text-[#92400E] rounded-full font-semibold text-[11px]">Impact: {expectedLag}</span>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
        <Button variant="outline" size="sm" className="w-full gap-2 text-[#1D4ED8] border-[#DBEAFE] hover:bg-[#EFF6FF] hover:border-[#93C5FD]">
          Create Action Item
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
