'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, Target, Database, Settings, Zap } from 'lucide-react';

const navItems = [
  { path: '/home', label: 'Launch Pulse', icon: Activity },
  { path: '/insights', label: 'Insights', icon: BarChart3 },
  { path: '/actions', label: 'Actions & Impact', icon: Target },
  { path: '/data-mapping', label: 'Data & Mapping', icon: Database, admin: true },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ lastRunAt }: { lastRunAt?: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col" style={{ boxShadow: '1px 0 8px rgba(15, 23, 42, 0.04)' }}>
      {/* Branded header */}
      <div className="h-16 flex items-center px-5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 2px 8px rgba(29, 78, 216, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[#0F172A] tracking-tight block leading-tight">Launch Pulse</span>
            <span className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-widest">Analytics</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative
                ${isActive 
                  ? 'text-white' 
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }
              `}
              style={isActive ? {
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 2px 8px rgba(29, 78, 216, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              } : undefined}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-3">
        <div className="px-4 py-3 rounded-xl border border-[#E2E8F0] bg-gradient-to-b from-[#F8FAFC] to-white">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
            </span>
            <span className="text-[10px] font-semibold text-[#16A34A] uppercase tracking-wider">Live</span>
          </div>
          <div className="text-[11px] text-[#64748B]">Last data drop</div>
          <div className="text-xs font-semibold text-[#0F172A]" style={{ fontVariantNumeric: 'tabular-nums' }}>{lastRunAt ?? '—'}</div>
        </div>
      </div>
    </aside>
  );
}
