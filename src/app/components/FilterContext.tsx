import React, { createContext, useContext, useState, ReactNode } from 'react';

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

export function FilterProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState('ONC-101');
  const [timeWindow, setTimeWindow] = useState('Last 7 days');
  const [geography, setGeography] = useState('Nation');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <FilterContext.Provider value={{ brand, timeWindow, geography, searchQuery, setBrand, setTimeWindow, setGeography, setSearchQuery }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
}
