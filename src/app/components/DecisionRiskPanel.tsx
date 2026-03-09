import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DecisionRiskPanel({ risks }: { risks: string[] }) {
  return (
    <div
      className="rounded-2xl p-6 border border-[#D97706]/15 overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FFEDD5 100%)',
        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            boxShadow: '0 2px 6px rgba(217, 119, 6, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-[#92400E]">Confidence Flags</h3>
          <p className="text-[11px] text-[#B45309]">Signals that may change interpretation</p>
        </div>
      </div>
      <ul className="space-y-2">
        {risks.map((risk, index) => (
          <li key={index} className="text-sm text-[#92400E] flex items-start gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-3.5 border border-[#D97706]/10">
            <span className="w-5 h-5 rounded-full bg-[#FFEDD5] flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-semibold text-[#D97706]">
              {index + 1}
            </span>
            <span className="font-medium leading-relaxed">{risk}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
