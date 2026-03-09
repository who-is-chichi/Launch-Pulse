import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'motion/react';

interface KPITileProps {
  title: string;
  value: string;
  delta: string;
  deltaType: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  index?: number;
}

export default function KPITile({ title, value, delta, deltaType, sparklineData, index = 0 }: KPITileProps) {
  const deltaColors = {
    up: 'text-[#16A34A]',
    down: 'text-[#DC2626]',
    neutral: 'text-[#64748B]',
  };

  const deltaBg = {
    up: 'bg-[#DCFCE7]',
    down: 'bg-[#FEE2E2]',
    neutral: 'bg-[#F1F5F9]',
  };

  const sparklineColor = {
    up: '#16A34A',
    down: '#DC2626',
    neutral: '#1D4ED8',
  };

  const accentGradient = {
    up: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, transparent 60%)',
    down: 'linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, transparent 60%)',
    neutral: 'linear-gradient(135deg, rgba(29, 78, 216, 0.06) 0%, transparent 60%)',
  };

  const DeltaIcon = deltaType === 'up' ? TrendingUp : deltaType === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group bg-white rounded-2xl border border-[#E2E8F0] p-5 transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden relative"
      style={{
        boxShadow: 'var(--card-shadow)',
        backgroundImage: accentGradient[deltaType],
      }}
      whileHover={{
        boxShadow: '0 8px 25px -5px rgba(15, 23, 42, 0.1), 0 4px 10px -5px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">{title}</div>
        <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${deltaBg[deltaType]} ${deltaColors[deltaType]}`}>
          <DeltaIcon className="w-3 h-3" />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{delta}</span>
        </div>
      </div>

      <div className="text-3xl font-semibold text-[#0F172A] mb-4 tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>

      {sparklineData && (
        <div className="h-10 flex items-end gap-[3px]">
          {sparklineData.map((val, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm"
              initial={{ height: 0 }}
              animate={{ height: `${val}%` }}
              transition={{ duration: 0.5, delay: index * 0.08 + i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                backgroundColor: sparklineColor[deltaType],
                opacity: 0.15 + (i / sparklineData.length) * 0.65,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
