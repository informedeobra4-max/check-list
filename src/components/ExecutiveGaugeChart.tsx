import React from 'react';

interface ExecutiveGaugeChartProps {
  value: number; // 0 to 100
  label?: string;
  size?: number;
  status?: 'ok' | 'warning' | 'critical';
  colorVariant?: 'coral_cyan' | 'amber' | 'coral';
  className?: string;
}

export function ExecutiveGaugeChart({
  value,
  label,
  size = 84,
  status = 'critical',
  colorVariant = 'coral_cyan',
  className = ''
}: ExecutiveGaugeChartProps) {
  // Angle maps from -90deg (far left, 0%) to +90deg (far right, 100%)
  const clampedValue = Math.max(0, Math.min(100, value));
  const angle = -90 + (clampedValue / 100) * 180;

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2 + 6;

  const gradId = `gaugeGrad_${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.7}`} className="overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {colorVariant === 'coral_cyan' ? (
              <>
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="50%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#00f2fe" />
              </>
            ) : colorVariant === 'amber' ? (
              <>
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#334155" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#334155" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Background Semicircle Arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored Segment Arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="url(#gaugeArcGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Needle Line */}
        <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={-radius + 4}
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="drop-shadow-[0_0_3px_rgba(255,255,255,0.8)] transition-transform duration-700 ease-out"
          />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>
      </svg>

      {label && (
        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
