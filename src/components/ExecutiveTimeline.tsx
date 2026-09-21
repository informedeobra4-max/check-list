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
        <div className="flex items-center gap-2">
          <span className="text-white flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            Hoy
          </span>
          {delayMonths > 0 && (
            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" />
              DEMORA: +{delayMonths} meses
            </span>
          )}
        </div>
        <span>Fin Estimado</span>
      </div>

      {/* Horizontal Bar with Nodes */}
      <div className="relative py-2.5 flex items-center">
        {/* Base Track */}
        <div className="absolute inset-x-0 h-1 bg-slate-800 rounded-full" />

        {/* Progress Track (Inicio to Hoy) in Cyan/Emerald */}
        <div
          className="absolute left-0 h-1 bg-gradient-to-r from-emerald-500 to-[#00f2fe] rounded-full shadow-[0_0_8px_rgba(0,242,254,0.4)]"
          style={{ width: `${hoyPercent}%` }}
        />

        {/* Delay Track (Hoy to End) in Coral/Red */}
        <div
          className="absolute h-1 bg-rose-500/80 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]"
          style={{ left: `${hoyPercent}%`, width: `${100 - hoyPercent}%` }}
        />

        {/* Node 1: Inicio */}
        <div className="absolute left-0 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-emerald-400" />
        </div>

        {/* Node 2: Hoy (Active Red/Coral Marker with subtle vertical indicator) */}
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${hoyPercent}%` }}
        >
          <div className="w-4 h-4 rounded-full bg-slate-950 border-2 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
        </div>

        {/* Node 3: Fin Estimado */}
        <div className="absolute right-0 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-slate-600 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-slate-400" />
        </div>
      </div>

      {/* Dates Row */}
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-0.5">
        <span>{startLabel}</span>
        <span className="text-slate-300 font-black">{currentYear}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
