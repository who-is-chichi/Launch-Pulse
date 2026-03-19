'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useFilters } from '../FilterContext';

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { brand, setBrand, timeWindow, setTimeWindow, geography, setGeography, searchQuery, setSearchQuery } = useFilters();
  const [availableBrands, setAvailableBrands] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.brands) && data.brands.length > 0) setAvailableBrands(data.brands); })
      .catch(() => {});
  }, []);

  function navigate(updates: { brand?: string; timeWindow?: string; geography?: string }) {
    const b = updates.brand ?? brand;
    const tw = updates.timeWindow ?? timeWindow;
    const geo = updates.geography ?? geography;
    const params = new URLSearchParams();
    if (b !== 'ONC-101') params.set('brand', b);
    if (tw !== 'Last 7 days') params.set('timeWindow', tw);
    if (geo !== 'Nation') params.set('geography', geo);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  }

  function handleBrand(v: string) { setBrand(v); navigate({ brand: v }); }
  function handleTimeWindow(v: string) { setTimeWindow(v); navigate({ timeWindow: v }); }
  function handleGeography(v: string) { setGeography(v); navigate({ geography: v }); }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4" style={{ boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
      <div className="flex items-center gap-2.5 flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold text-[#0F172A]">
              {brand}
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {availableBrands.length > 0
              ? availableBrands.map(b => (
                  <DropdownMenuItem key={b.code} onClick={() => handleBrand(b.code)}>{b.code}</DropdownMenuItem>
                ))
              : <DropdownMenuItem onClick={() => handleBrand('ONC-101')}>ONC-101</DropdownMenuItem>
            }
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-[#E2E8F0]" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[#64748B] hover:text-[#334155]">
              {timeWindow}
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleTimeWindow('Last 7 days')}>Last 7 days</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTimeWindow('Last 4 weeks')}>Last 4 weeks</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTimeWindow('Custom')}>Custom</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-[#64748B] hover:text-[#334155]">
              {geography}
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleGeography('Nation')}>Nation</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGeography('Northeast')}>Northeast</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGeography('Midwest')}>Midwest</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGeography('Southwest')}>Southwest</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGeography('West')}>West</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#16A34A] px-2 py-1 bg-[#DCFCE7] rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
          Latest run
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search insights, accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-72 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 focus:border-[#93C5FD] focus:bg-white transition-all duration-200"
          />
        </div>

        <NotificationPanel />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold text-white cursor-pointer transition-transform duration-150 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 2px 6px rgba(29, 78, 216, 0.3)',
              }}
            >
              AT
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}