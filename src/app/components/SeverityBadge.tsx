import React from 'react';

interface SeverityBadgeProps {
  severity: 'High' | 'Medium' | 'Low';
  className?: string;
  showIcon?: boolean;
}

const severityConfig = {
  High: {
    className: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    dotColor: 'bg-[#DC2626]',
    ring: 'ring-[#DC2626]/20',
  },
  Medium: {
    className: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    dotColor: 'bg-[#D97706]',
    ring: 'ring-[#D97706]/20',
  },
  Low: {
    className: 'bg-[#EFF6FF] text-[#1E3A8A] border-[#BFDBFE]',
    dotColor: 'bg-[#1D4ED8]',
    ring: 'ring-[#1D4ED8]/20',
  },
};

export default function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.className} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {severity}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: 'High' | 'Medium' | 'Low' }) {
  const config = severityConfig[severity];
  return (
    <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor} ring-4 ${config.ring} flex-shrink-0`}></span>
  );
}
