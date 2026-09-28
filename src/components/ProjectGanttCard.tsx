import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  CheckCircle2,
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

const DAY_WIDTH = 28; // Ancho en píxeles de cada columna de día
const STICKY_COL_WIDTH = 140; // Ancho de la columna izquierda de responsables

export function ProjectGanttCard({
  project,
  neonColor = '#00f2fe',
  onOpenProjectManager,
  onOpenCalendarModal,
  contractors
}: ProjectGanttCardProps) {
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getTodayString(), []);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Generar rango continuo de meses y días para abarcar todas las tareas del proyecto
  const { monthsList, daysList, todayIndex, dateToIndex } = useMemo(() => {
    const allEvents = project.calendarEvents || [];

    // Recolectar fechas clave del proyecto y sus tareas
    const dates: string[] = [todayStr];
    if (project.startDate) dates.push(project.startDate);
    if (project.estimatedEndDate) dates.push(project.estimatedEndDate);
    allEvents.forEach(e => {
      if (e.date) dates.push(e.date);
      if (e.startDate) dates.push(e.startDate);
    });

    // El cronograma siempre comienza 2 meses antes del mes actual para ver semanas recientes
    // Nunca dejamos que una fecha antigua histórica (ej. 2023) desplace la vista 3 años atrás
    const startD = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Fin: al menos 10 meses hacia adelante desde hoy (o la fecha final si hay tareas futuras)
    let endD = new Date(now.getFullYear(), now.getMonth() + 10 + 1, 0);

    dates.forEach(d => {
      const parts = d.split('-').map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const y = parts[0];
        const m = parts[1] - 1; // 0 a 11
        const taskEndDate = new Date(y, m + 1, 0);
        if (taskEndDate > endD) {
          endD = taskEndDate;
        }
      }
    });

    const mList: {
      year: number;
      monthIndex: number;
      name: string;
      daysCount: number;
      startDayIndex: number;
    }[] = [];

    const dList: {
      dayNum: number;
      dateStr: string;
      weekdayLetter: string;
      isWeekend: boolean;
      isToday: boolean;
      monthIndex: number;
      year: number;
    }[] = [];

    const dToIdx = new Map<string, number>();

    let cur = new Date(startD.getFullYear(), startD.getMonth(), 1);
    let globalDayCounter = 0;
    let iter = 0;

    // Permitir hasta 24 meses continuos con total fluidez
    while (cur <= endD && iter < 24) {
      iter++;
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const daysInCurMonth = new Date(y, m + 1, 0).getDate();

      mList.push({
        year: y,
        monthIndex: m,
        name: MONTH_NAMES[m],
        daysCount: daysInCurMonth,
        startDayIndex: globalDayCounter
      });

      for (let day = 1; day <= daysInCurMonth; day++) {
        const dayDate = new Date(y, m, day);
        const dayOfWeek = dayDate.getDay();
        const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        dList.push({
          dayNum: day,
          dateStr: dStr,
          weekdayLetter: WEEKDAY_INITIALS[dayOfWeek],
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isToday: dStr === todayStr,
          monthIndex: m,
          year: y
        });

        dToIdx.set(dStr, globalDayCounter);
        globalDayCounter++;
      }

      cur = new Date(y, m + 1, 1);
    }

    const tIdx = dList.findIndex(d => d.isToday);

    return {
      monthsList: mList,
      daysList: dList,
      todayIndex: tIdx,
      dateToIndex: dToIdx
    };
  }, [project, todayStr, now]);

  // Contratistas activos de la obra
  const activeContractors = useMemo(() => {
    if (contractors && contractors.length > 0) return contractors;
    return getProjectContractors(project);
  }, [contractors, project]);

  const allEvents = project.calendarEvents || [];
  const totalDays = daysList.length;
  const timelineStartStr = daysList[0]?.dateStr || '';
  const timelineEndStr = daysList[totalDays - 1]?.dateStr || '';

  // Agrupar filas por contratista con carriles automáticos (lanes) si hay solapamiento
  const contractorRows = useMemo(() => {
    const rawRows: {
      profile: ContractorProfile;
      tasks: ProjectCalendarEvent[];
    }[] = [];

    // 1. Contratistas oficiales
    activeContractors.forEach(c => {
      const assigned = allEvents.filter(
        e => e.assignedTo?.trim().toLowerCase() === c.name.toLowerCase()
      );
      rawRows.push({
        profile: c,
        tasks: assigned
      });
    });

    // 2. Responsables presentes en tareas no incluidos en la lista oficial
    const assignedNames = new Set(activeContractors.map(c => c.name.toLowerCase()));
    allEvents.forEach(e => {
      if (e.assignedTo?.trim() && !assignedNames.has(e.assignedTo.trim().toLowerCase())) {
        assignedNames.add(e.assignedTo.trim().toLowerCase());
        const prof = getContractorProfile(e.assignedTo.trim(), e.assignedRole, activeContractors);
        rawRows.push({
          profile: prof,
          tasks: allEvents.filter(t => t.assignedTo?.trim().toLowerCase() === e.assignedTo?.trim().toLowerCase())
        });
      }
    });

    // 3. Tareas generales sin asignar
    const unassignedTasks = allEvents.filter(e => !e.assignedTo?.trim());
    if (unassignedTasks.length > 0) {
      rawRows.unshift({
        profile: getContractorProfile('Cuadrilla General', 'Tareas Generales', activeContractors),
        tasks: unassignedTasks
      });
    }

    // Calcular posición y carril (lane) para cada tarea continua
    return rawRows.map(row => {
      const sorted = [...row.tasks].sort((a, b) => {
        const aStart = a.startDate || a.date;
        const bStart = b.startDate || b.date;
        return aStart.localeCompare(bStart);
      });

      const lanesEnd: number[] = [];
      const positionedTasks: {
        event: ProjectCalendarEvent;
        leftOffset: number;
        width: number;
        lane: number;
        taskStart: string;
        taskEnd: string;
      }[] = [];

      sorted.forEach(task => {
        const taskStart = task.startDate || task.date;
        const taskEnd = task.date;

        if (taskEnd < timelineStartStr || taskStart > timelineEndStr) return;

        let startIdx = 0;
        if (taskStart >= timelineStartStr) {
          startIdx = dateToIndex.get(taskStart) ?? 0;
        }

        let endIdx = totalDays - 1;
        if (taskEnd <= timelineEndStr) {
          endIdx = dateToIndex.get(taskEnd) ?? (totalDays - 1);
        }

        if (endIdx < startIdx) endIdx = startIdx;

        // Asignar primer carril disponible
        let assignedLane = -1;
        for (let l = 0; l < lanesEnd.length; l++) {
          if (lanesEnd[l] < startIdx) {
            assignedLane = l;
            lanesEnd[l] = endIdx;
            break;
          }
        }
        if (assignedLane === -1) {
          assignedLane = lanesEnd.length;
          lanesEnd.push(endIdx);
        }

        const spanDays = endIdx - startIdx + 1;
        positionedTasks.push({
          event: task,
          leftOffset: startIdx * DAY_WIDTH + 2,
          width: Math.max(DAY_WIDTH - 4, spanDays * DAY_WIDTH - 4),
          lane: assignedLane,
          taskStart,
          taskEnd
        });
      });

      const totalLanes = Math.max(1, lanesEnd.length);
      const rowHeight = totalLanes === 1 ? 40 : totalLanes * 26 + 12;

      return {
        profile: row.profile,
        tasks: row.tasks,
        positionedTasks,
        rowHeight,
        totalLanes
      };
    });
  }, [activeContractors, allEvents, timelineStartStr, timelineEndStr, dateToIndex, totalDays]);

  // Estadísticas globales del Gantt
  const stats = useMemo(() => {
    const total = allEvents.length;
    const completed = allEvents.filter(t => t.completed || t.status === 'completed').length;
    const critical = allEvents.filter(t => getTaskAlarms(t, todayStr).isCriticalDelay).length;
    const upcoming = allEvents.filter(t => getTaskAlarms(t, todayStr).isUpcomingDeadline).length;
    return { total, completed, critical, upcoming };
  }, [allEvents, todayStr]);

  // Función para centrar exactamente en el día de hoy
  const scrollToToday = (behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current || todayIndex < 0) return;
    const containerW = scrollRef.current.clientWidth || 600;
    const targetX = Math.max(0, todayIndex * DAY_WIDTH - (containerW / 2) + (STICKY_COL_WIDTH / 2));
    scrollRef.current.scrollTo({ left: targetX, behavior });
  };

  // Centrar automáticamente en el día de hoy al cargar en múltiples frames para asegurar layout completo
  useEffect(() => {
    if (todayIndex >= 0) {
      scrollToToday('auto');
      const rAF = requestAnimationFrame(() => {
        scrollToToday('auto');
      });
      const timer = setTimeout(() => {
        scrollToToday('smooth');
      }, 150);
      return () => {
        cancelAnimationFrame(rAF);
        clearTimeout(timer);
      };
    }
  }, [todayIndex]);

  // Navegación rápida con botones
  const handleScrollToToday = () => {
    scrollToToday('smooth');
  };

  const handleScrollDelta = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const delta = dir === 'right' ? 500 : -500;
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Soporte bidireccional (2D) de arrastre con mouse además del toque táctil nativo
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, [data-interactive="true"]')) return;
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX;
    startYRef.current = e.pageY;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    scrollTopRef.current = scrollRef.current.scrollTop;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const walkX = (e.pageX - startXRef.current) * 1.3;
    const walkY = (e.pageY - startYRef.current) * 1.3;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walkX;
    scrollRef.current.scrollTop = scrollTopRef.current - walkY;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleOpenPM = (taskId?: string, dateStr?: string) => {
    if (onOpenProjectManager) {
      onOpenProjectManager(project.id, taskId ? 'tasks' : 'dashboard', dateStr || todayStr, taskId);
    } else if (onOpenCalendarModal) {
      onOpenCalendarModal(project.id, dateStr || todayStr);
    }
  };

  const firstMonth = monthsList[0];
  const lastMonth = monthsList[monthsList.length - 1];

  return (
    <div
      onClick={(e) => {
        // Evitar que hacer clic en el Gantt active la selección de la obra entera
        e.stopPropagation();
      }}
      className="bg-[#0f172a]/95 rounded-2xl p-2.5 sm:p-3 border border-slate-800/90 flex flex-col justify-between select-none shadow-inner min-w-0 overflow-hidden w-full"
    >
      {/* 1. HEADER: Título Continuo, Controles de Desplazamiento y Acceso a PM */}
      <div>
        <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-800/80 flex-wrap sm:flex-nowrap">
          {/* Título & Rango de Meses Continuos */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="w-3.5 h-3.5 flex-shrink-0" style={{ color: neonColor }} />
            <span className="text-[11px] font-black uppercase tracking-wider text-white truncate">
              Gantt Continuo • {firstMonth?.name} {firstMonth?.year} - {lastMonth?.name} {lastMonth?.year}
            </span>

            {/* Stepper Rápido de Meses y Botón Hoy */}
            <div className="flex items-center gap-0.5 ml-1">
              <button
                type="button"
                onClick={() => handleScrollDelta('left')}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Deslizar meses anteriores"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleScrollToToday}
                className="px-2 py-0.5 rounded text-[9.5px] font-black text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-cyan-500/30"
                title="Centrar en el día de hoy"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => handleScrollDelta('right')}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Deslizar meses siguientes"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Badges de Resumen y Acceso a Project Manager */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 text-[9.5px]">
              {stats.critical > 0 && (
                <span
                  onClick={() => handleOpenPM()}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer font-black animate-pulse"
                  title="Tareas críticas con retraso en el Gantt"
                >
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>{stats.critical} críticas</span>
                </span>
              )}

              {stats.upcoming > 0 && (
                <span className="hidden sm:flex items-center gap-0.5 text-amber-400 font-bold">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{stats.upcoming} próx.</span>
                </span>
              )}

              <span className="text-slate-400 font-medium">
                <span className="text-white font-bold">{stats.total}</span> tareas
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPM()}
              className="px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 text-slate-950 shrink-0"
              style={{ backgroundColor: neonColor }}
              title="Abrir vista completa del Project Manager & Gantt"
            >
              <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Abrir PM</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MATRIZ 2D DE GANTT: CABECERA FIJA SUPERIOR Y COLUMNA FIJA DE RESPONSABLES */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`overflow-x-auto overflow-y-auto no-scrollbar scrollbar-none gantt-scroll-viewport flex-1 max-h-[350px] my-1 select-none border border-slate-800/80 rounded-xl bg-[#090f1d] ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div
          className="relative text-left"
          style={{
            width: `${STICKY_COL_WIDTH + daysList.length * DAY_WIDTH}px`,
            minWidth: `${STICKY_COL_WIDTH + daysList.length * DAY_WIDTH}px`
          }}
        >
          {/* CABECERA FIJA SUPERIOR (STICKY TOP-0 Z-30) */}
          <div className="sticky top-0 z-30 bg-[#0b1220] border-b border-slate-800 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
            <div className="flex items-stretch">
              {/* Esquina Superior Izquierda: Fija tanto en X como en Y (STICKY TOP-0 LEFT-0 Z-50) */}
              <div
                className="sticky left-0 z-50 bg-[#0b1220] px-2.5 py-1.5 flex flex-col justify-center border-r border-slate-800 shadow-[3px_0_8px_rgba(0,0,0,0.6)] shrink-0"
                style={{ width: `${STICKY_COL_WIDTH}px` }}
              >
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider block">
                  Responsable
                </span>
                <span className="text-[8.5px] text-slate-500 font-bold truncate">
                  {contractorRows.length} cuadrillas
                </span>
              </div>

              {/* Área de Meses y Días continuos */}
              <div className="flex flex-col flex-1">
                {/* Fila 1: Meses */}
                <div className="flex items-center border-b border-slate-800/80">
                  {monthsList.map(m => (
                    <div
                      key={`${m.year}-${m.monthIndex}`}
                      className="border-r border-slate-800/80 px-2 flex items-center justify-between shrink-0 bg-[#0d1527] h-6"
                      style={{ width: `${m.daysCount * DAY_WIDTH}px` }}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 truncate">
                        {m.name} {m.year}
                      </span>
                      <span className="text-[8.5px] text-slate-500 font-mono">
                        {m.daysCount}d
                      </span>
                    </div>
                  ))}
                </div>

                {/* Fila 2: Días */}
                <div className="flex items-center h-6">
                  {daysList.map(d => (
                    <div
                      key={d.dateStr}
                      className={`flex flex-col items-center justify-center border-r border-slate-800/40 text-center shrink-0 ${
                        d.isToday
                          ? 'bg-cyan-500/20 text-cyan-300 font-black'
                          : d.isWeekend
                          ? 'bg-slate-900/60 text-slate-500'
                          : 'text-slate-400'
                      }`}
                      style={{ width: `${DAY_WIDTH}px`, height: '24px' }}
                      title={`${d.dayNum} - ${d.dateStr}`}
                    >
                      <span className="text-[7.5px] leading-none text-slate-500">
                        {d.weekdayLetter}
                      </span>
                      <span className={`text-[9.5px] leading-tight rounded px-0.5 ${d.isToday ? 'bg-cyan-400 text-slate-950 font-black' : ''}`}>
                        {d.dayNum}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CUERPO: FILAS DE CUADRILLAS / RESPONSABLES */}
          <div className="relative divide-y divide-slate-800/50">
            {/* Línea vertical indicadora del día de hoy a lo largo de toda la matriz */}
            {todayIndex >= 0 && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10"
                style={{
                  left: `${STICKY_COL_WIDTH + todayIndex * DAY_WIDTH + DAY_WIDTH / 2}px`,
                  width: '2px'
                }}
              >
                <div className="w-[2px] h-full border-l-2 border-dashed border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              </div>
            )}

            {contractorRows.map(row => (
              <div
                key={row.profile.id}
                className="flex items-center hover:bg-slate-800/30 transition-colors group relative"
                style={{ height: `${row.rowHeight}px` }}
              >
                {/* Columna Izquierda Fija: Avatar + Nombre + Cargo (STICKY LEFT-0 Z-20) */}
                <div
                  onClick={() => handleOpenPM(undefined, todayStr)}
                  className="sticky left-0 z-20 bg-[#0f172a] px-2 flex items-center gap-2 border-r border-slate-800 shadow-[3px_0_6px_rgba(0,0,0,0.6)] shrink-0 cursor-pointer group-hover:bg-slate-850"
                  style={{ width: `${STICKY_COL_WIDTH}px`, height: `${row.rowHeight}px` }}
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
                    <p className="text-[10px] font-black text-slate-200 group-hover:text-cyan-400 truncate leading-tight transition-colors">
                      {row.profile.name}
                    </p>
                    <p className="text-[8px] text-slate-500 truncate leading-tight font-medium">
                      {row.profile.role}
                    </p>
                  </div>
                </div>

                {/* Track de Días y Tareas Continuas */}
                <div className="flex items-center relative h-full">
                  {daysList.map(d => (
                    <div
                      key={d.dateStr}
                      className={`h-full border-r border-slate-800/30 shrink-0 ${
                        d.isWeekend ? 'bg-slate-900/30' : ''
                      } ${d.isToday ? 'bg-cyan-500/10' : ''}`}
                      style={{ width: `${DAY_WIDTH}px` }}
                    />
                  ))}

                  {/* Píldoras de Tareas Continuas (Multimes sin cortes) */}
                  {row.positionedTasks.map(({ event: task, leftOffset, width, lane, taskStart, taskEnd }) => {
                    const alarms = getTaskAlarms(task, todayStr);
                    const isDone = task.completed || task.status === 'completed';

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
                        data-interactive="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPM(task.id, task.date);
                        }}
                        className={`absolute h-5 sm:h-5.5 rounded-lg text-[9px] font-black px-1.5 flex items-center justify-between gap-1 cursor-pointer transition-all shadow-md hover:scale-[1.02] active:scale-95 z-10 truncate ${pillClasses}`}
                        style={{
                          left: `${leftOffset}px`,
                          width: `${width}px`,
                          top: `${6 + lane * 26}px`
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
              <div className="py-8 text-center text-xs text-slate-500">
                No hay cuadrillas configuradas en esta obra.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. FOOTER: Indicador de Navegación 2D y Acción Rápida */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 text-cyan-400/90 font-medium">
          <MoveHorizontal className="w-3.5 h-3.5 animate-pulse" />
          <span>Desliza lateralmente para ver todos los meses y hacia abajo para más cuadrillas</span>
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
