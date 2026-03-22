'use client';

import React, { createContext, useContext, useState, ReactNode, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface FilterState {
  brand: string;
  timeWindow: string;
  geography: string;
  searchQuery: string;
  setBrand: (v: string) => void;
  setTimeWindow: (v: string) => void;
  setGeography: (v: string) => void;
  setSearchQuery: (v: string) => void;
}

const FilterContext = createContext<FilterState | undefined>(undefined);

function FilterProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [brand, setBrand] = useState(searchParams.get('brand') ?? 'ONC-101');
  const [timeWindow, setTimeWindow] = useState(searchParams.get('timeWindow') ?? 'Last 7 days');
  const [geography, setGeography] = useState(searchParams.get('geography') ?? 'Nation');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <FilterContext.Provider value={{ brand, timeWindow, geography, searchQuery, setBrand, setTimeWindow, setGeography, setSearchQuery }}>
      {children}
    </FilterContext.Provider>
  );
}

export function FilterProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <FilterProviderInner>{children}</FilterProviderInner>
    </Suspense>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
}
