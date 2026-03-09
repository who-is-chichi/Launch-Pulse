import React from 'react';
import { Search, Bell, ChevronDown, User } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useFilters } from '../FilterContext';

export default function TopBar() {
  const { brand, setBrand, timeWindow, setTimeWindow, geography, setGeography, searchQuery, setSearchQuery } = useFilters();

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
            <DropdownMenuItem onClick={() => setBrand('ONC-101')}>ONC-101</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBrand('ONC-201')}>ONC-201</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBrand('ONC-301')}>ONC-301</DropdownMenuItem>
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
            <DropdownMenuItem onClick={() => setTimeWindow('Last 7 days')}>Last 7 days</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeWindow('Last 4 weeks')}>Last 4 weeks</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeWindow('Custom')}>Custom</DropdownMenuItem>
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
            <DropdownMenuItem onClick={() => setGeography('Nation')}>Nation</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGeography('Northeast')}>Northeast</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGeography('Midwest')}>Midwest</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGeography('Southwest')}>Southwest</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGeography('West')}>West</DropdownMenuItem>
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

        <Button variant="ghost" size="icon" className="relative rounded-xl">
          <Bell className="w-[18px] h-[18px] text-[#64748B]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white"></span>
        </Button>

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
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}