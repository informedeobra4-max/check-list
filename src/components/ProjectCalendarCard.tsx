import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, AlertTriangle, CheckSquare, Clock, Flag, Bell, Sparkles } from 'lucide-react';
import { Project, ProjectCalendarEvent } from '../types';
import { hexToRgba } from '../utils/calculations';

interface ProjectCalendarCardProps {
  project: Project;
  neonColor?: string;
  onOpenCalendarModal: (projectId: string, initialDate?: string, selectedEventId?: string) => void;
  onToggleCalendarEvent?: (projectId: string, eventId: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function ProjectCalendarCard({
  project,
  neonColor = '#00f2fe',
  onOpenCalendarModal,
  onToggleCalendarEvent
}: ProjectCalendarCardProps) {
  // Current real date or project base date
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [now]);

  // Calendar month/year navigation state
  const [viewDate, setViewDate] = useState<Date>(() => {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Selected date inside calendar
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0 to 11

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleResetToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(todayStr);
  };

  // Days in month calculation
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Day of week for 1st day of month (Monday = 0, Sunday = 6)
  const startDayOffset = useMemo(() => {
    const day = new Date(currentYear, currentMonth, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }, [currentYear, currentMonth]);

  // Map of events by YYYY-MM-DD specifically for this project
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ProjectCalendarEvent[]>();
    (project.calendarEvents || []).forEach(evt => {
      const list = map.get(evt.date) || [];
      list.push(evt);
      map.set(evt.date, list);
    });
    return map;
  }, [project.calendarEvents]);

  // Project milestones by date
  const milestonesByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    (project.milestones || []).forEach(ms => {
      const dateKey = ms.targetDate || ms.endDate;
      if (dateKey) {
        const list = map.get(dateKey) || [];
        list.push(ms);
        map.set(dateKey, list);
      }
    });
    return map;
  }, [project.milestones]);

  // Events count in the current visible month
  const monthStats = useMemo(() => {
    let taskCount = 0;
    let alarmCount = 0;
    let eventCount = 0;

    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    (project.calendarEvents || []).forEach(evt => {
      if (evt.date.startsWith(prefix)) {
        if (evt.type === 'alarm') alarmCount++;
        else if (evt.type === 'event') eventCount++;
        else taskCount++;
      }
    });

    return { taskCount, alarmCount, eventCount, total: taskCount + alarmCount + eventCount };
  }, [project.calendarEvents, currentYear, currentMonth]);

  // Events of the currently selected date
  const selectedDayEvents = useMemo(() => {
    return eventsByDate.get(selectedDateStr) || [];
  }, [eventsByDate, selectedDateStr]);

  const selectedDayMilestones = useMemo(() => {
    return milestonesByDate.get(selectedDateStr) || [];
  }, [milestonesByDate, selectedDateStr]);

  // If selected day has no events, find closest upcoming event in the month
  const nextUpcomingEvent = useMemo(() => {
    if (selectedDayEvents.length > 0) return null;
    const sorted = [...(project.calendarEvents || [])]
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0] || null;
  }, [project.calendarEvents, selectedDayEvents, todayStr]);

  return (
    <div
      onClick={(e) => {
        // Prevent clicking calendar card from triggering project selection if user is clicking inside calendar
        e.stopPropagation();
      }}
      className="bg-[#0f172a]/90 rounded-2xl p-3 border border-slate-800/90 flex flex-col justify-between select-none shadow-inner"
    >
      {/* 1. Header: Month Navigation + Action buttons */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: neonColor }} />
            <span className="text-[11px] font-black uppercase tracking-wider text-white truncate">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
          </div>

          {/* Month Steppers & Quick Add */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetToToday}
              className="px-1.5 py-0.5 rounded text-[9.5px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              title="Ir al mes y día actual"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onOpenCalendarModal(project.id, selectedDateStr)}
              className="ml-0.5 px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 transition-all shadow-xs active:scale-95 text-slate-950"
              style={{ backgroundColor: neonColor }}
              title="Abrir agenda de esta obra para agregar tareas o alarmas"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Agenda</span>
            </button>
          </div>
        </div>

        {/* Month Stats Indicators Pill */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-slate-800/80 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
              <span className="font-semibold">{monthStats.alarmCount} alarmas</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
              <span className="font-semibold">{monthStats.taskCount} tareas</span>
            </span>
          </div>

          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {monthStats.total} en {MONTH_NAMES[currentMonth].slice(0, 3)}
          </span>
        </div>

        {/* 2. Calendar Grid: Weekdays Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 mb-1">
          {WEEKDAYS.map((wd, i) => (
            <div key={i} className="py-0.5">
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar Grid: Days of the Month */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty spacer slots for start of month */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-6 w-full" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;

            const dayEvts = eventsByDate.get(dateStr) || [];
            const dayMilestones = milestonesByDate.get(dateStr) || [];
            const hasAlarms = dayEvts.some(e => e.type === 'alarm');
            const hasTasks = dayEvts.some(e => e.type === 'task');
            const hasEvents = dayEvts.some(e => e.type === 'event');
            const hasMilestone = dayMilestones.length > 0;
            const hasAny = dayEvts.length > 0 || hasMilestone;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDateStr(dateStr)}
                onDoubleClick={() => onOpenCalendarModal(project.id, dateStr)}
                className={`h-6 rounded-lg text-[10.5px] font-bold flex flex-col items-center justify-center relative transition-all duration-150 ${
                  isSelected
                    ? 'bg-slate-700/90 text-white ring-1 ring-amber-400 shadow-sm'
                    : isToday
                    ? 'bg-slate-800/90 text-white border border-slate-600'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                style={
                  isSelected
                    ? { borderColor: neonColor, boxShadow: `0 0 8px ${hexToRgba(neonColor, 0.4)}` }
                    : undefined
                }
                title={`${dayNum} de ${MONTH_NAMES[currentMonth]}: ${dayEvts.length} ítems, ${dayMilestones.length} hitos (Doble clic para gestionar)`}
              >
                <span className={`leading-none ${isToday ? 'font-black' : ''}`}>
                  {dayNum}
                </span>

                {/* Event Dots Container */}
                {hasAny && (
                  <div className="flex items-center justify-center gap-0.5 mt-0.5 leading-none">
                    {hasAlarms && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)] animate-pulse" />
                    )}
                    {hasTasks && !hasAlarms && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]" />
                    )}
                    {hasEvents && !hasAlarms && !hasTasks && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                    {hasMilestone && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Summary Section: Selected Day Details */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-300 mb-1">
          <span className="flex items-center gap-1 text-slate-400 uppercase text-[9.5px] font-black">
            <span>Día {selectedDateStr.split('-')[2]} de {MONTH_NAMES[parseInt(selectedDateStr.split('-')[1], 10) - 1]?.slice(0, 3)}:</span>
            {selectedDayEvents.length + selectedDayMilestones.length > 0 && (
              <span className="text-white font-extrabold" style={{ color: neonColor }}>
                {selectedDayEvents.length + selectedDayMilestones.length} programados
              </span>
            )}
          </span>

          <button
            type="button"
            onClick={() => onOpenCalendarModal(project.id, selectedDateStr)}
            className="text-[9.5px] text-amber-400 hover:text-amber-300 font-bold hover:underline flex items-center gap-0.5"
          >
            <span>Ver día</span>
            <span>›</span>
          </button>
        </div>

        {/* Selected Day Event List */}
        {selectedDayEvents.length > 0 || selectedDayMilestones.length > 0 ? (
          <div className="space-y-1 max-h-20 overflow-y-auto pr-0.5">
            {selectedDayEvents.map(evt => (
              <div
                key={evt.id}
                onClick={() => onOpenCalendarModal(project.id, selectedDateStr, evt.id)}
                className="p-1 px-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-1.5 cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {evt.type === 'alarm' ? (
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                  ) : evt.type === 'event' ? (
                    <CalendarIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <CheckSquare className="w-3 h-3 text-cyan-400 shrink-0" />
                  )}
                  <span className={`text-[10px] font-bold text-slate-200 truncate group-hover:text-white ${evt.completed ? 'line-through text-slate-500' : ''}`}>
                    {evt.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {evt.time && (
                    <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {evt.time}
                    </span>
                  )}
                  {evt.priority === 'urgent' && (
                    <span className="text-[8.5px] font-black uppercase px-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Urgente
                    </span>
                  )}
                </div>
              </div>
            ))}

            {selectedDayMilestones.map(ms => (
              <div
                key={ms.id}
                onClick={() => onOpenCalendarModal(project.id, selectedDateStr)}
                className="p-1 px-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/60 transition-all flex items-center justify-between gap-1.5 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Flag className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="text-[10px] font-bold text-purple-200 truncate">
                    Hito: {ms.name}
                  </span>
                </div>
                <span className="text-[8.5px] font-bold text-purple-300 bg-purple-900/60 px-1 rounded">
                  Hito
                </span>
              </div>
            ))}
          </div>
        ) : nextUpcomingEvent ? (
          <div
            onClick={() => {
              setSelectedDateStr(nextUpcomingEvent.date);
              onOpenCalendarModal(project.id, nextUpcomingEvent.date, nextUpcomingEvent.id);
            }}
            className="p-1.5 rounded-lg bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-2 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="text-[10px] text-slate-400 truncate">
                Próximo: <span className="font-bold text-slate-200 group-hover:text-white">{nextUpcomingEvent.title}</span>
              </span>
            </div>
            <span className="text-[9px] font-bold text-amber-400 shrink-0">
              {nextUpcomingEvent.date.split('-')[2]}/{nextUpcomingEvent.date.split('-')[1]}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[10px] text-slate-400 italic">
              Sin tareas programadas para este día
            </span>
            <button
              type="button"
              onClick={() => onOpenCalendarModal(project.id, selectedDateStr)}
              className="text-[9.5px] text-slate-300 hover:text-white font-bold bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
            >
              + Agregar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
