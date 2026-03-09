import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ConfidenceBadgeProps {
  confidence: 'High' | 'Medium' | 'Low';
  className?: string;
  showTooltip?: boolean;
}

const confidenceConfig = {
  High: {
    className: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
    icon: CheckCircle2,
    tooltip: 'High confidence - multiple data sources corroborate this insight',
  },
  Medium: {
    className: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
    icon: AlertCircle,
    tooltip: 'Medium confidence - some uncertainty in driver attribution',
  },
  Low: {
    className: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    icon: HelpCircle,
    tooltip: 'Low confidence - decision risk. Limited data or structural changes detected.',
  },
};

export default function ConfidenceBadge({ confidence, className = '', showTooltip = true }: ConfidenceBadgeProps) {
  const config = confidenceConfig[confidence];
  const Icon = config.icon;

  const badge = (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.className} ${className}`}>
      <Icon className="w-3 h-3" />
      {confidence}
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="bg-[#0F172A] text-white border-[#0F172A] rounded-lg">
          <p className="max-w-xs text-xs">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
