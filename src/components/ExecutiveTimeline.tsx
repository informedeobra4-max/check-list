import React from 'react';
import { AlertCircle, Calendar } from 'lucide-react';

interface ExecutiveTimelineProps {
  startDate?: string;
  estimatedEndDate?: string;
  progress: number;
  delayMonths?: number;
  className?: string;
}

export function ExecutiveTimeline({
  startDate,
  estimatedEndDate,
  progress,
  delayMonths = 3,
  className = ''
}: ExecutiveTimelineProps) {
  // Format readable dates
  const formatShortDate = (isoStr?: string, fallback: string = '2025') => {
    if (!isoStr) return fallback;
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const startLabel = startDate ? formatShortDate(startDate, '2025') : '2025';
  const endLabel = estimatedEndDate ? formatShortDate(estimatedEndDate, '31 oct 2025') : '31 oct 2025';
  const currentYear = new Date().getFullYear();

  // Position of 'Hoy' along the 0-100% axis
  // If progress is low, Hoy is around 50-60% of timeline to show delayed completion
  const hoyPercent = 58;

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {/* Top Labels Row */}
      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 px-1">
        <span>Inicio</span>
        <span className="text-white flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          Hoy
        </span>
        <span>Fin Estimado</span>
      </div>

      {/* Horizontal Bar with Nodes */}
      <div className="relative pt-6 pb-2.5 flex items-center">
        {/* Base Track */}
        <div className="absolute inset-x-0 h-1 bg-slate-800 rounded-full" />

        {/* Progress Track (Inicio to Hoy) in Cyan/Emerald */}
        <div
          className="absolute left-0 h-1 bg-gradient-to-r from-emerald-500 to-[#00f2fe] rounded-full shadow-[0_0_8px_rgba(0,242,254,0.4)]"
          style={{ width: `${hoyPercent}%` }}
        />

        {/* Delay Track (Hoy to End) in Coral/Salmon */}
        <div
          className="absolute h-1 bg-[#f87171] rounded-full shadow-[0_0_8px_rgba(248,113,113,0.5)]"
          style={{ left: `${hoyPercent}%`, width: `${100 - hoyPercent}%` }}
        />

        {/* Node 1: Inicio (Cyan ring with inner point) */}
        <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 border-2 border-[#00f2fe] shadow-[0_0_8px_rgba(0,242,254,0.5)] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00f2fe]" />
        </div>

        {/* Node 2: Hoy with Floating Demora Speech Bubble above it */}
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${hoyPercent}%` }}
        >
          {delayMonths > 0 && (
            <div className="absolute -top-6 flex flex-col items-center">
              <span className="bg-[#f87171] text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black shadow-[0_0_10px_rgba(248,113,113,0.4)] whitespace-nowrap">
                DEMORA: +{delayMonths} meses
              </span>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#f87171]" />
            </div>
          )}
          <div className="w-4 h-4 rounded-full bg-slate-950 border-2 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
        </div>

        {/* Node 3: Fin Estimado (Amber Upward Triangle) */}
        <div className="absolute right-0 translate-x-1/2 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
        </div>
      </div>

      {/* Dates Row */}
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-0.5">
        <span>{startLabel}</span>
        <span className="text-slate-300 font-black">{currentYear}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
