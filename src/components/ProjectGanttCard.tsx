import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  MoveHorizontal,
  Plus,
  Layers
} from 'lucide-react';
import { Project, ProjectCalendarEvent, ContractorProfile } from '../types';
import { getTodayString, getTaskAlarms, formatPMDate } from '../utils/pmCalculations';
import { getContractorProfile, getProjectContractors } from '../utils/pmContractors';
import { ContractorAvatar } from './ContractorAvatar';

interface ProjectGanttCardProps {
  project: Project;
  neonColor?: string;
  onOpenProjectManager?: (
    projectId: string,
    initialTab?: 'dashboard' | 'tasks' | 'calendar',
    initialDate?: string,
    selectedTaskId?: string
  ) => void;
  onOpenCalendarModal?: (projectId: string, initialDate?: string, selectedEventId?: string) => void;
  contractors?: ContractorProfile[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const DAY_WIDTH = 30; // Ancho en píxeles de cada columna de día
const STICKY_COL_WIDTH = 138; // Ancho de la columna izquierda de responsables

export function ProjectGanttCard({
  project,
  neonColor = '#00f2fe',
  onOpenProjectManager,
  onOpenCalendarModal,
  contractors
}: ProjectGanttCardProps) {
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getTodayString(), []);

  // Mes y año visualizado en este Gantt
  const [viewDate, setViewDate] = useState<Date>(() => {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0 a 11

  const scrollRef = useRef<HTMLDivElement>(null);

  // Total de días en el mes
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Lista de días del mes
  const daysList = useMemo(() => {
    const list: {
      dayNum: number;
      dateStr: string;
      weekdayLetter: string;
      isWeekend: boolean;
      isToday: boolean;
    }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dayOfWeek = dateObj.getDay(); // 0 Dom, 6 Sáb
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      list.push({
        dayNum: d,
        dateStr: dStr,
        weekdayLetter: WEEKDAY_INITIALS[dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: dStr === todayStr
      });
    }
    return list;
  }, [currentYear, currentMonth, daysInMonth, todayStr]);

  // Índice de hoy si está en el mes visualizado
  const todayIndex = useMemo(() => {
    return daysList.findIndex(d => d.isToday);
  }, [daysList]);

  // Contratistas activos de la obra
  const activeContractors = useMemo(() => {
    if (contractors && contractors.length > 0) return contractors;
    return getProjectContractors(project);
  }, [contractors, project]);

  // Tareas del proyecto para este mes
  const monthStartStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const monthEndStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const allEvents = project.calendarEvents || [];

  // Tareas que se solapan con este mes
  const monthEvents = useMemo(() => {
    return allEvents.filter(e => {
      const taskStart = e.startDate || e.date;
      const taskEnd = e.date;
      return taskEnd >= monthStartStr && taskStart <= monthEndStr;
    });
  }, [allEvents, monthStartStr, monthEndStr]);

  // Agrupar filas por contratista
  const contractorRows = useMemo(() => {
    const rows: {
      profile: ContractorProfile;
      tasks: ProjectCalendarEvent[];
    }[] = [];

    // 1. Agregar contratistas oficiales del proyecto
    activeContractors.forEach(c => {
      const assigned = monthEvents.filter(
        e => e.assignedTo?.trim().toLowerCase() === c.name.toLowerCase()
      );
      rows.push({
        profile: c,
        tasks: assigned
      });
    });

    // 2. Revisar si hay responsables en tareas no incluidos en la lista oficial
    const assignedNames = new Set(activeContractors.map(c => c.name.toLowerCase()));
    monthEvents.forEach(e => {
      if (e.assignedTo?.trim() && !assignedNames.has(e.assignedTo.trim().toLowerCase())) {
        assignedNames.add(e.assignedTo.trim().toLowerCase());
        const prof = getContractorProfile(e.assignedTo.trim(), e.assignedRole, activeContractors);
        rows.push({
          profile: prof,
          tasks: monthEvents.filter(t => t.assignedTo?.trim().toLowerCase() === e.assignedTo?.trim().toLowerCase())
        });
      }
    });

    // 3. Tareas generales sin asignar
    const unassignedTasks = monthEvents.filter(e => !e.assignedTo?.trim());
    if (unassignedTasks.length > 0) {
      rows.unshift({
        profile: getContractorProfile('Cuadrilla General', 'Tareas Generales', activeContractors),
        tasks: unassignedTasks
      });
    }

    return rows;
  }, [activeContractors, monthEvents]);

  // Estadísticas del mes
  const stats = useMemo(() => {
    const total = monthEvents.length;
    const completed = monthEvents.filter(t => t.completed || t.status === 'completed').length;
    const critical = monthEvents.filter(t => getTaskAlarms(t, todayStr).isCriticalDelay).length;
    const upcoming = monthEvents.filter(t => getTaskAlarms(t, todayStr).isUpcomingDeadline).length;
    return { total, completed, critical, upcoming };
  }, [monthEvents, todayStr]);

  // Auto-scroll al día de hoy al cargar o cambiar de mes
  useEffect(() => {
    if (scrollRef.current && todayIndex >= 0) {
      // Centrar el día actual en la ventana visible
      const scrollPos = Math.max(0, todayIndex * DAY_WIDTH - 90);
      scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [todayIndex, currentMonth, currentYear]);

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
  };

  const handleOpenPM = (taskId?: string, dateStr?: string) => {
    if (onOpenProjectManager) {
      onOpenProjectManager(project.id, taskId ? 'tasks' : 'dashboard', dateStr || todayStr, taskId);
    } else if (onOpenCalendarModal) {
      onOpenCalendarModal(project.id, dateStr || todayStr);
    }
  };

  return (
    <div
      onClick={(e) => {
        // Evitar que hacer clic en el Gantt active la selección de la obra entera
        e.stopPropagation();
      }}
      className="bg-[#0f172a]/90 rounded-2xl p-3 border border-slate-800/90 flex flex-col justify-between select-none shadow-inner min-w-0 overflow-hidden h-full"
    >
      {/* 1. HEADER: Título, Navegación de Meses y Acciones */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-2">
          {/* Título & Mes */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Briefcase className="w-3.5 h-3.5 flex-shrink-0" style={{ color: neonColor }} />
            <span className="text-[11px] font-black uppercase tracking-wider text-white truncate">
              Gantt • {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
          </div>

          {/* Controles de Navegación de Meses */}
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
              title="Ir al mes actual"
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
              onClick={() => handleOpenPM()}
              className="ml-1 px-2.5 py-1 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 text-slate-950 shrink-0"
              style={{ backgroundColor: neonColor }}
              title="Abrir vista completa del Project Manager & Gantt"
            >
              <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Abrir PM</span>
              {stats.critical > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Badges de Tareas & Retrasos en el Mes */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-slate-800/80 mb-1 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            {stats.critical > 0 && (
              <span
                onClick={() => handleOpenPM()}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer font-black animate-pulse"
                title="Tareas críticas con retraso en el Gantt"
              >
                <Flame className="w-3 h-3 text-rose-400" />
                <span>{stats.critical} retrasos</span>
              </span>
            )}

            {stats.upcoming > 0 && (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{stats.upcoming} próx.</span>
              </span>
            )}

            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              <span className="font-semibold">{stats.total} tareas en Gantt</span>
            </span>
          </div>

          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {stats.completed}/{stats.total} listas
          </span>
        </div>
      </div>

      {/* 2. MATRIZ DE GANTT DESLIZABLE CON EL DEDO (TOUCH-PAN-X) */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto custom-scrollbar touch-pan-x flex-1 overscroll-x-contain my-1 select-none max-h-[220px]"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x'
        }}
      >
        <div
          className="relative text-left"
          style={{
            width: `${STICKY_COL_WIDTH + daysInMonth * DAY_WIDTH}px`,
            minWidth: `${STICKY_COL_WIDTH + daysInMonth * DAY_WIDTH}px`
          }}
        >
          {/* HEADER: DÍAS DEL MES */}
          <div className="flex items-center border-b border-slate-800 bg-[#0b1220] sticky top-0 z-30">
            {/* Columna Izquierda Fija: Responsables */}
            <div
              className="sticky left-0 z-40 bg-[#0b1220] px-2 py-1 flex items-center justify-between border-r border-slate-800 shadow-[3px_0_6px_rgba(0,0,0,0.5)] shrink-0"
              style={{ width: `${STICKY_COL_WIDTH}px` }}
            >
              <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">
                Responsable
              </span>
              <span className="text-[9px] text-slate-500 font-bold">
                {contractorRows.length}
              </span>
            </div>

            {/* Columnas de Días (1..31) */}
            <div className="flex items-center">
              {daysList.map((d) => (
                <div
                  key={d.dateStr}
                  className={`flex flex-col items-center justify-center border-r border-slate-800/40 text-center shrink-0 py-0.5 ${
                    d.isToday
                      ? 'bg-blue-600/20'
                      : d.isWeekend
                      ? 'bg-slate-900/50'
                      : ''
                  }`}
                  style={{ width: `${DAY_WIDTH}px` }}
                >
                  <span className={`text-[8.5px] leading-tight ${d.isToday ? 'text-cyan-300 font-black' : 'text-slate-500'}`}>
                    {d.weekdayLetter}
                  </span>
                  <span
                    className={`text-[10px] leading-tight rounded px-1 ${
                      d.isToday
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                        : 'text-slate-300 font-bold'
                    }`}
                  >
                    {d.dayNum}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CUERPO: FILAS POR RESPONSABLE */}
          <div className="relative divide-y divide-slate-800/50">
            {/* Línea vertical indicadora del día de hoy */}
            {todayIndex >= 0 && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10"
                style={{
                  left: `${STICKY_COL_WIDTH + todayIndex * DAY_WIDTH + DAY_WIDTH / 2}px`,
                  width: '2px'
                }}
              >
                <div className="w-[2px] h-full border-l-2 border-dashed border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
              </div>
            )}

            {contractorRows.map((row) => (
              <div
                key={row.profile.id}
                className="flex items-center hover:bg-slate-800/30 transition-colors group relative"
                style={{ height: '36px' }}
              >
                {/* Columna Izquierda Fija: Avatar + Nombre */}
                <div
                  onClick={() => handleOpenPM(undefined, todayStr)}
                  className="sticky left-0 z-20 bg-[#0f172a] px-2 flex items-center gap-2 border-r border-slate-800 shadow-[3px_0_6px_rgba(0,0,0,0.5)] shrink-0 cursor-pointer group-hover:bg-slate-850"
                  style={{ width: `${STICKY_COL_WIDTH}px`, height: '36px' }}
                  title={`${row.profile.name} - ${row.profile.role} (Clic para abrir PM)`}
                >
                  <ContractorAvatar
                    avatarUrl={row.profile.avatarUrl}
                    name={row.profile.name}
                    color={row.profile.color || neonColor}
                    sizeClassName="w-6 h-6"
                    ringClassName="ring-1 shadow-xs"
                    showStatusDot
                    statusColor={row.profile.color || neonColor}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-black text-slate-200 group-hover:text-cyan-400 truncate leading-tight transition-colors">
                      {row.profile.name}
                    </p>
                    <p className="text-[8.5px] text-slate-500 truncate leading-tight font-medium">
                      {row.profile.role}
                    </p>
                  </div>
                </div>

                {/* Track de Días con Celdas de Fondo */}
                <div className="flex items-center relative h-full">
                  {daysList.map((d) => (
                    <div
                      key={d.dateStr}
                      className={`h-full border-r border-slate-800/30 shrink-0 ${
                        d.isWeekend ? 'bg-slate-900/30' : ''
                      } ${d.isToday ? 'bg-blue-600/10' : ''}`}
                      style={{ width: `${DAY_WIDTH}px` }}
                    />
                  ))}

                  {/* Píldoras de Tareas Superpuestas */}
                  {row.tasks.map((task) => {
                    const taskStart = task.startDate || task.date;
                    const taskEnd = task.date;

                    // Calcular inicio y fin dentro del mes
                    const startParts = taskStart.split('-').map(Number);
                    const endParts = taskEnd.split('-').map(Number);

                    // Si la tarea empieza antes de este mes, fijar día 1
                    let startDay = 1;
                    if (startParts[0] === currentYear && startParts[1] === currentMonth + 1) {
                      startDay = startParts[2];
                    } else if (taskStart > monthEndStr) {
                      return null;
                    }

                    // Si la tarea termina después de este mes, fijar día final
                    let endDay = daysInMonth;
                    if (endParts[0] === currentYear && endParts[1] === currentMonth + 1) {
                      endDay = endParts[2];
                    } else if (taskEnd < monthStartStr) {
                      return null;
                    }

                    startDay = Math.max(1, Math.min(daysInMonth, startDay));
                    endDay = Math.max(startDay, Math.min(daysInMonth, endDay));

                    const spanDays = endDay - startDay + 1;
                    const leftOffset = (startDay - 1) * DAY_WIDTH + 2;
                    const pillWidth = spanDays * DAY_WIDTH - 4;

                    const alarms = getTaskAlarms(task, todayStr);
                    const isDone = task.completed || task.status === 'completed';

                    // Colores temáticos vibrantes según estado
                    let pillClasses = 'bg-cyan-500 text-slate-950';
                    if (isDone) {
                      pillClasses = 'bg-emerald-500 text-white';
                    } else if (alarms.isCriticalDelay) {
                      pillClasses = 'bg-rose-500 text-white animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]';
                    } else if (alarms.isUpcomingDeadline || task.status === 'in_progress') {
                      pillClasses = 'bg-amber-400 text-slate-950';
                    }

                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPM(task.id, task.date);
                        }}
                        className={`absolute top-1.5 h-6 rounded-lg text-[9.5px] font-black px-1.5 flex items-center justify-between gap-1 cursor-pointer transition-all shadow-md hover:scale-[1.03] active:scale-95 z-10 truncate ${pillClasses}`}
                        style={{
                          left: `${leftOffset}px`,
                          width: `${Math.max(DAY_WIDTH - 4, pillWidth)}px`
                        }}
                        title={`${task.title} (${formatPMDate(taskStart)} al ${formatPMDate(taskEnd)}) • Clic para editar`}
                      >
                        <span className="truncate flex-1">{task.title}</span>
                        {isDone && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                        {alarms.isCriticalDelay && <Flame className="w-2.5 h-2.5 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {contractorRows.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500">
                No hay cuadrillas configuradas en esta obra.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. FOOTER: Indicador táctil de deslizamiento y botón de acción */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 text-cyan-400/90 font-medium">
          <MoveHorizontal className="w-3.5 h-3.5 animate-pulse" />
          <span>Desliza con el dedo para recorrer los {daysInMonth} días</span>
        </div>

        <button
          type="button"
          onClick={() => handleOpenPM()}
          className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          <span>Nueva Tarea</span>
        </button>
      </div>
    </div>
  );
}
