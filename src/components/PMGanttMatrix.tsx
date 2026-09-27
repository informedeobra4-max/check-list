import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Plus,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Calendar,
  Sparkles,
  Tool
} from 'lucide-react';
import { Project, ProjectCalendarEvent, PMTaskStatus } from '../types';
import { getTodayString, getTaskAlarms } from '../utils/pmCalculations';
import { getContractorProfile, DEFAULT_CONTRACTORS } from '../utils/pmContractors';

interface PMGanttMatrixProps {
  project: Project;
  neonColor?: string;
  viewDate: Date; // Year and month being viewed
  windowStartIndex: number; // 0 for days 1-16, 16 for days 17-31
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleWindow: () => void;
  onSelectTask: (task: ProjectCalendarEvent) => void;
  onQuickAddTask: (contractorName: string, dateStr: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function PMGanttMatrix({
  project,
  neonColor = '#00f2fe',
  viewDate,
  windowStartIndex,
  onPrevMonth,
  onNextMonth,
  onToggleWindow,
  onSelectTask,
  onQuickAddTask,
  statusFilter,
  onStatusFilterChange
}: PMGanttMatrixProps) {
  const todayStr = useMemo(() => getTodayString(), []);
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-11

  // Total days in current viewed month
  const totalDaysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Window of days to display (16 days slice to match Dribbble reference)
  const visibleDays = useMemo(() => {
    const days: { dayNum: number; dateStr: string; weekdayName: string; isWeekend: boolean; isToday: boolean }[] = [];
    const count = 16;
    const start = Math.min(windowStartIndex, Math.max(0, totalDaysInMonth - count));

    for (let i = 0; i < count; i++) {
      const dayNum = start + i + 1;
      if (dayNum > totalDaysInMonth) break;

      const d = new Date(currentYear, currentMonth, dayNum);
      const weekdayIdx = d.getDay(); // 0 is Sunday, 6 is Saturday
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateStr = `${currentYear}-${mStr}-${dStr}`;

      days.push({
        dayNum,
        dateStr,
        weekdayName: WEEKDAY_SHORT_ES[weekdayIdx],
        isWeekend: weekdayIdx === 0 || weekdayIdx === 6,
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [currentYear, currentMonth, totalDaysInMonth, windowStartIndex, todayStr]);

  // Today column index if in current visible window
  const todayColIndex = useMemo(() => {
    return visibleDays.findIndex(d => d.isToday);
  }, [visibleDays]);

  // Collect list of contractors: start with those already referenced in project tasks, then fill with default
  const contractorRows = useMemo(() => {
    const events = project.calendarEvents || [];
    const assignedNames = new Set<string>();

    events.forEach(e => {
      if (e.assignedTo?.trim()) assignedNames.add(e.assignedTo.trim());
    });

    const list: { name: string; role: string; profile: ReturnType<typeof getContractorProfile>; tasks: ProjectCalendarEvent[] }[] = [];

    // Add existing assigned contractors first
    assignedNames.forEach(name => {
      const sample = events.find(e => e.assignedTo?.trim() === name);
      const profile = getContractorProfile(name, sample?.assignedRole);
      const contractorTasks = events.filter(e => e.assignedTo?.trim() === name);
      list.push({
        name,
        role: profile.role,
        profile,
        tasks: contractorTasks
      });
    });

    // If less than 5 rows, add defaults so the Gantt has that rich Dribbble dashboard density
    DEFAULT_CONTRACTORS.forEach(def => {
      if (!assignedNames.has(def.name)) {
        list.push({
          name: def.name,
          role: def.role,
          profile: def,
          tasks: events.filter(e => e.assignedTo?.trim() === def.name)
        });
      }
    });

    // Also include an "Equipo General / Sin Asignar" row if there are tasks with no assignee
    const unassignedTasks = events.filter(e => !e.assignedTo?.trim());
    if (unassignedTasks.length > 0) {
      list.unshift({
        name: 'Cuadrilla General',
        role: 'Tareas de Obra',
        profile: getContractorProfile('Cuadrilla General', 'Tareas Generales'),
        tasks: unassignedTasks
      });
    }

    return list.slice(0, 6); // Keep 5-6 rows for optimal vertical rhythm matching image
  }, [project.calendarEvents]);

  // Helper to calculate pill placement within visible 16 days
  const getTaskPillMetrics = (task: ProjectCalendarEvent) => {
    const taskEnd = task.date;
    const taskStart = task.startDate || task.date;

    // Convert to year-month-day comparisons
    const firstVis = visibleDays[0]?.dateStr;
    const lastVis = visibleDays[visibleDays.length - 1]?.dateStr;

    if (!firstVis || !lastVis) return null;
    if (taskEnd < firstVis || taskStart > lastVis) return null; // Out of visible window

    // Clamped indices in the visibleDays array
    let startIdx = visibleDays.findIndex(d => d.dateStr >= taskStart);
    if (startIdx === -1) startIdx = 0;
    if (taskStart < firstVis) startIdx = 0;

    let endIdx = visibleDays.findIndex(d => d.dateStr === taskEnd);
    if (endIdx === -1) {
      if (taskEnd > lastVis) {
        endIdx = visibleDays.length - 1;
      } else {
        endIdx = visibleDays.findLastIndex(d => d.dateStr <= taskEnd);
        if (endIdx === -1) endIdx = startIdx;
      }
    }

    if (endIdx < startIdx) endIdx = startIdx;

    const span = endIdx - startIdx + 1;
    const totalCols = visibleDays.length;
    const leftPct = (startIdx / totalCols) * 100;
    const widthPct = (span / totalCols) * 100;

    return {
      startIdx,
      endIdx,
      span,
      leftPct,
      widthPct
    };
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200/80 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-black/40 p-4 sm:p-6 overflow-hidden transition-colors">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Planificación de Obra
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              {project.calendarEvents?.length || 0} tareas
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Cronograma interactivo y asignación de tareas por cuadrilla
          </p>
        </div>

        {/* CONTROLS (Date Picker, Pagination, Filters) */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Month / Year Navigator */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-xs font-black text-slate-800 dark:text-white min-w-[120px] text-center flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              <span>{MONTH_NAMES_ES[currentMonth]} {currentYear}</span>
            </div>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Window Toggle (Days 1-16 vs 16-31) */}
          <button
            type="button"
            onClick={onToggleWindow}
            className="px-3 py-2 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-colors"
          >
            {windowStartIndex === 0 ? 'Días 1 - 16' : `Días 16 - ${totalDaysInMonth}`}
          </button>

          {/* Filter Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 cursor-pointer focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="critical">🚨 Atrasos Críticos</option>
            <option value="in_progress">⚡ En Curso</option>
            <option value="pending">⏳ Pendientes</option>
            <option value="completed">✅ Finalizadas</option>
          </select>
        </div>
      </div>

      {/* MATRIX GANTT CONTAINER */}
      <div className="relative overflow-x-auto custom-scrollbar pb-2">
        <div className="min-w-[850px] select-none">
          
          {/* HEADER ROW (Employees label + 16 Days) */}
          <div className="grid grid-cols-[210px_repeat(16,minmax(0,1fr))] gap-1.5 items-center mb-2 px-1">
            {/* Left Header */}
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-2">
              Responsables
            </div>

            {/* Days Header */}
            {visibleDays.map((d, idx) => (
              <div
                key={d.dateStr}
                className="flex flex-col items-center justify-center text-center py-1"
              >
                <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  {d.weekdayName}
                </span>
                
                {/* Day number with pill if today */}
                <div
                  className={`mt-0.5 w-6 h-6 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${
                    d.isToday
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-2 ring-blue-400/30 font-black'
                      : d.isWeekend
                      ? 'text-slate-400 dark:text-slate-600'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {d.dayNum}
                </div>
              </div>
            ))}
          </div>

          {/* MATRIX BODY WITH RELATIVE WRAPPER FOR VERTICAL TODAY LINE */}
          <div className="relative space-y-2">
            
            {/* VERTICAL TODAY DASHED LINE (Across all rows, matching Dribbble reference) */}
            {todayColIndex !== -1 && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10 flex justify-center"
                style={{
                  left: `calc(210px + 6px + (100% - 216px) * ${(todayColIndex + 0.5) / visibleDays.length})`,
                  width: '2px'
                }}
              >
                <div className="w-[2px] h-full border-l-2 border-dashed border-blue-500/80 dark:border-blue-400/90 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              </div>
            )}

            {/* CONTRACTOR ROWS */}
            {contractorRows.map((contractor) => (
              <div
                key={contractor.name}
                className="grid grid-cols-[210px_repeat(16,minmax(0,1fr))] gap-1.5 items-center p-1.5 rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
              >
                {/* LEFT CELL: CONTRACTOR PROFILE */}
                <div className="flex items-center gap-3 pr-2 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={contractor.profile.avatarUrl}
                      alt={contractor.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-sm"
                      onError={(e) => {
                        // Fallback initials if image fails to load
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white absolute inset-0 -z-10 shadow-inner"
                      style={{ backgroundColor: contractor.profile.color }}
                    >
                      {contractor.profile.initials}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-slate-800 dark:text-white truncate">
                      {contractor.name}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate font-medium">
                      {contractor.role}
                    </p>
                  </div>
                </div>

                {/* RIGHT CELL: GANTT DAY CELLS & FLOATING TASK PILLS */}
                <div className="col-span-16 relative h-12 flex items-center">
                  
                  {/* BACKGROUND DAY CELLS */}
                  <div className="absolute inset-0 grid grid-cols-16 gap-1.5">
                    {visibleDays.map((d) => (
                      <div
                        key={d.dateStr}
                        onClick={() => onQuickAddTask(contractor.name, d.dateStr)}
                        className={`h-full rounded-xl transition-all cursor-pointer ${
                          d.isWeekend
                            ? 'bg-slate-100/70 dark:bg-slate-800/25 border border-dashed border-slate-200 dark:border-slate-800/60'
                            : 'bg-slate-50/60 dark:bg-slate-800/15 border border-slate-100 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                        }`}
                        style={
                          d.isWeekend
                            ? {
                                backgroundImage:
                                  'repeating-linear-gradient(45deg, rgba(148,163,184,0.06), rgba(148,163,184,0.06) 4px, transparent 4px, transparent 8px)'
                              }
                            : undefined
                        }
                        title={`Asignar tarea a ${contractor.name} el ${d.dayNum}/${currentMonth + 1}`}
                      />
                    ))}
                  </div>

                  {/* FLOATING TASK PILLS FOR THIS CONTRACTOR */}
                  {contractor.tasks
                    .filter((task) => {
                      if (statusFilter === 'all') return true;
                      const alarms = getTaskAlarms(task, todayStr);
                      if (statusFilter === 'critical') return alarms.isCriticalDelay;
                      if (statusFilter === 'in_progress') return task.status === 'in_progress' && !task.completed;
                      if (statusFilter === 'pending') return (!task.status || task.status === 'pending') && !task.completed;
                      if (statusFilter === 'completed') return task.completed || task.status === 'completed';
                      return true;
                    })
                    .map((task) => {
                      const metrics = getTaskPillMetrics(task);
                      if (!metrics) return null;

                      const alarms = getTaskAlarms(task, todayStr);
                      const isCompleted = task.completed || task.status === 'completed';

                      // Determine pill gradient matching Dribbble reference
                      let pillGradient = 'from-sky-500 via-blue-500 to-indigo-600 text-white shadow-sky-500/25 border-sky-300/40';
                      let statusText = 'En Curso';

                      if (alarms.isCriticalDelay) {
                        pillGradient = 'from-rose-600 via-rose-500 to-red-600 text-white shadow-rose-500/30 border-rose-300/50 animate-pulse';
                        statusText = `Atraso +${alarms.daysOverdue}d`;
                      } else if (alarms.isUpcomingDeadline) {
                        pillGradient = 'from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-amber-500/30 border-amber-200/60';
                        statusText = alarms.daysUntilDeadline === 0 ? '¡Hoy!' : `${alarms.daysUntilDeadline}d`;
                      } else if (isCompleted) {
                        pillGradient = 'from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-emerald-500/25 border-emerald-300/40';
                        statusText = 'Aprobado';
                      } else if (task.type === 'alarm') {
                        pillGradient = 'from-purple-600 via-indigo-600 to-blue-600 text-white shadow-purple-500/25 border-purple-300/40';
                        statusText = 'Alarma';
                      }

                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(task);
                          }}
                          className={`absolute z-10 top-1 bottom-1 px-3 py-1.5 rounded-2xl bg-gradient-to-r ${pillGradient} shadow-md border flex items-center justify-between gap-2 cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all active:scale-95 group/pill`}
                          style={{
                            left: `${metrics.leftPct}%`,
                            width: `${Math.max(metrics.widthPct, 7)}%`
                          }}
                          title={`${task.title} - ${task.startDate || task.date} al ${task.date}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {alarms.isCriticalDelay ? (
                              <Flame className="w-3.5 h-3.5 shrink-0 animate-pulse text-yellow-200" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-200" />
                            ) : (
                              <Briefcase className="w-3.5 h-3.5 shrink-0 opacity-90" />
                            )}
                            <span className="text-[11px] font-black truncate tracking-tight">
                              {task.title}
                            </span>
                          </div>

                          {/* Status Pill Badge (like "Approved", "Pending" in reference) */}
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black bg-black/25 backdrop-blur-xs text-white/95 uppercase tracking-wider border border-white/20">
                            {statusText}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}
