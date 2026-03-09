import React from 'react';

interface PillarTagProps {
  pillar: 'Demand' | 'Start Ops' | 'Execution' | 'Structure';
  className?: string;
}

const pillarConfig = {
  Demand: {
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#1E40AF]',
    border: 'border-[#BFDBFE]',
    dot: 'bg-[#1D4ED8]',
  },
  'Start Ops': {
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#166534]',
    border: 'border-[#BBF7D0]',
    dot: 'bg-[#16A34A]',
  },
  Execution: {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#92400E]',
    border: 'border-[#FDE68A]',
    dot: 'bg-[#D97706]',
  },
  Structure: {
    bg: 'bg-[#F5F3FF]',
    text: 'text-[#5B21B6]',
    border: 'border-[#DDD6FE]',
    dot: 'bg-[#7C3AED]',
  },
};

export default function PillarTag({ pillar, className = '' }: PillarTagProps) {
  const config = pillarConfig[pillar];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {pillar}
    </span>
  );
}
