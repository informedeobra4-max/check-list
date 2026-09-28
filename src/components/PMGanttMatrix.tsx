import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoveHorizontal,
  Plus,
  Users,
  Pencil,
  Calendar,
  Filter
} from 'lucide-react';
import { Project, ProjectCalendarEvent, PMTaskStatus, ContractorProfile } from '../types';
import { getTodayString, getTaskAlarms, formatPMDate } from '../utils/pmCalculations';
import { getContractorProfile, getProjectContractors } from '../utils/pmContractors';
import { ContractorAvatar } from './ContractorAvatar';

interface PMGanttMatrixProps {
  project: Project;
  contractors?: ContractorProfile[];
  neonColor?: string;
  viewDate?: Date;
  windowStartIndex?: number;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onToggleWindow?: () => void;
  onSelectTask: (task: ProjectCalendarEvent) => void;
  onQuickAddTask: (contractorName: string, dateStr: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onOpenContractorManager?: () => void;
  onEditContractor?: (contractor: ContractorProfile) => void;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const DAY_WIDTH = 30; // Ancho en px de cada columna de día
const STICKY_COL_WIDTH = 190; // Ancho de la columna de responsables

export function PMGanttMatrix({
  project,
  contractors,
  neonColor = '#00f2fe',
  onSelectTask,
  onQuickAddTask,
  statusFilter,
  onStatusFilterChange,
  onOpenContractorManager,
  onEditContractor
}: PMGanttMatrixProps) {
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getTodayString(), []);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Generar rango continuo de meses y días centrado en la actualidad
  const { monthsList, daysList, todayIndex, dateToIndex } = useMemo(() => {
    const allEvents = project.calendarEvents || [];

    // Fechas relevantes
    const dates: string[] = [todayStr];
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
        name: MONTH_NAMES_ES[m],
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

  // Agrupar filas por contratista y filtrar tareas por statusFilter con carriles automáticos (lanes)
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

    // Filtrar tareas según statusFilter y calcular carriles automáticos (lanes)
    return rawRows.map(row => {
      const filteredTasks = row.tasks.filter(task => {
        if (statusFilter === 'all') return true;
        const alarms = getTaskAlarms(task, todayStr);
        if (statusFilter === 'critical') return alarms.isCriticalDelay;
        if (statusFilter === 'in_progress') return task.status === 'in_progress' && !task.completed;
        if (statusFilter === 'pending') return (!task.status || task.status === 'pending') && !task.completed;
        if (statusFilter === 'completed') return task.completed || task.status === 'completed';
        return true;
      });

      const sorted = [...filteredTasks].sort((a, b) => {
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
      const rowHeight = totalLanes === 1 ? 46 : totalLanes * 28 + 16;

      return {
        profile: row.profile,
        tasks: row.tasks,
        filteredTasks,
        positionedTasks,
        rowHeight,
        totalLanes
      };
    });
  }, [activeContractors, allEvents, timelineStartStr, timelineEndStr, dateToIndex, totalDays, statusFilter, todayStr]);

  // Estadísticas globales del Gantt
  const stats = useMemo(() => {
    const total = allEvents.length;
    const completed = allEvents.filter(t => t.completed || t.status === 'completed').length;
    const critical = allEvents.filter(t => getTaskAlarms(t, todayStr).isCriticalDelay).length;
    const inProgress = allEvents.filter(t => t.status === 'in_progress' && !t.completed).length;
    return { total, completed, critical, inProgress };
  }, [allEvents, todayStr]);

  // Función robusta para centrar en el día de hoy
  const scrollToToday = (behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current || todayIndex < 0) return;
    const containerW = scrollRef.current.clientWidth || 600;
    const targetX = Math.max(0, todayIndex * DAY_WIDTH - (containerW / 2) + (STICKY_COL_WIDTH / 2));
    scrollRef.current.scrollTo({ left: targetX, behavior });
  };

  // Centrar automáticamente en el día de hoy al cargar en múltiples frames
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
    if (target.closest('button, a, input, select, [data-interactive="true"]')) return;
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

  const firstMonth = monthsList[0];
  const lastMonth = monthsList[monthsList.length - 1];

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200/80 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-black/40 p-4 sm:p-5 overflow-hidden transition-colors w-full select-none">
      
      {/* 1. CABECERA: TÍTULO, SELECTOR DE ESTADOS, NAVEGADOR DE MESES Y ACCIONES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Diagrama de Gantt Continuo
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              {project.calendarEvents?.length || 0} tareas totales
            </span>
            {stats.critical > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3" />
                {stats.critical} críticas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Línea de tiempo continua ({firstMonth?.name} {firstMonth?.year} a {lastMonth?.name} {lastMonth?.year}) • Desliza con el dedo para recorrer meses y cuadrillas
          </p>
        </div>

        {/* CONTROLES: NAVEGADOR Y FILTROS */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Stepper Rápido y Botón Hoy */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <button
              type="button"
              onClick={() => handleScrollDelta('left')}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Deslizar meses anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleScrollToToday}
              className="px-3 py-1 rounded-xl text-xs font-black text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
              title="Centrar en el día de hoy"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              <span>Hoy</span>
            </button>

            <button
              type="button"
              onClick={() => handleScrollDelta('right')}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Deslizar meses siguientes"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 cursor-pointer focus:outline-none"
            >
              <option value="all">Todas las tareas ({stats.total})</option>
              <option value="critical">🚨 Atrasos Críticos ({stats.critical})</option>
              <option value="in_progress">⚡ En Curso ({stats.inProgress})</option>
              <option value="pending">⏳ Pendientes</option>
              <option value="completed">✅ Finalizadas ({stats.completed})</option>
            </select>
          </div>

          {/* Botón Gestión de Cuadrillas */}
          {onOpenContractorManager && (
            <button
              type="button"
              onClick={onOpenContractorManager}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 shadow-xs"
              title="Gestionar responsables y fotos de cuadrillas"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Equipo & Fotos</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MATRIZ 2D DE GANTT: CABECERA FIJA SUPERIOR Y COLUMNA FIJA DE RESPONSABLES */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`overflow-x-auto overflow-y-auto no-scrollbar scrollbar-none gantt-scroll-viewport max-h-[480px] select-none border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-[#090f1d] ${
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
          <div className="sticky top-0 z-30 bg-slate-100 dark:bg-[#0b1220] border-b border-slate-200 dark:border-slate-800 shadow-[0_4px_10px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
            <div className="flex items-stretch">
              {/* Esquina Superior Izquierda Fija en Ambos Ejes (STICKY TOP-0 LEFT-0 Z-50) */}
              <div
                className="sticky left-0 z-50 bg-slate-100 dark:bg-[#0b1220] px-3 py-1.5 flex items-center justify-between border-r border-slate-200 dark:border-slate-800 shadow-[3px_0_8px_rgba(0,0,0,0.1)] dark:shadow-[3px_0_8px_rgba(0,0,0,0.6)] shrink-0"
                style={{ width: `${STICKY_COL_WIDTH}px` }}
              >
                <div>
                  <span className="text-[10.5px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider block">
                    Responsable
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold truncate">
                    {contractorRows.length} cuadrillas
                  </span>
                </div>

                {onOpenContractorManager && (
                  <button
                    type="button"
                    onClick={onOpenContractorManager}
                    className="p-1 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    title="Editar cuadrillas"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Área de Meses y Días continuos */}
              <div className="flex flex-col flex-1">
                {/* Fila 1: Meses */}
                <div className="flex items-center border-b border-slate-200 dark:border-slate-800/80">
                  {monthsList.map(m => (
                    <div
                      key={`${m.year}-${m.monthIndex}`}
                      className="border-r border-slate-200 dark:border-slate-800/80 px-2 flex items-center justify-between shrink-0 bg-slate-200/60 dark:bg-[#0d1527] h-6"
                      style={{ width: `${m.daysCount * DAY_WIDTH}px` }}
                    >
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-300 truncate">
                        {m.name} {m.year}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
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
                      className={`flex flex-col items-center justify-center border-r border-slate-200/60 dark:border-slate-800/40 text-center shrink-0 ${
                        d.isToday
                          ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-black'
                          : d.isWeekend
                          ? 'bg-slate-200/40 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                      style={{ width: `${DAY_WIDTH}px`, height: '24px' }}
                      title={`${d.dayNum} - ${d.dateStr}`}
                    >
                      <span className="text-[7.5px] leading-none text-slate-400 dark:text-slate-500">
                        {d.weekdayLetter}
                      </span>
                      <span className={`text-[9.5px] leading-tight rounded px-0.5 ${d.isToday ? 'bg-cyan-500 text-slate-950 font-black' : ''}`}>
                        {d.dayNum}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CUERPO: FILAS DE CUADRILLAS / RESPONSABLES */}
          <div className="relative divide-y divide-slate-200 dark:divide-slate-800/50">
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
                className="flex items-center hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors group relative"
                style={{ height: `${row.rowHeight}px` }}
              >
                {/* Columna Izquierda Fija: Avatar + Nombre + Cargo + Botón Editar (STICKY LEFT-0 Z-20) */}
                <div
                  className="sticky left-0 z-20 bg-white dark:bg-[#0f172a] px-3 flex items-center justify-between gap-2 border-r border-slate-200 dark:border-slate-800 shadow-[3px_0_6px_rgba(0,0,0,0.06)] dark:shadow-[3px_0_6px_rgba(0,0,0,0.6)] shrink-0 group-hover:bg-slate-50 dark:group-hover:bg-slate-850"
                  style={{ width: `${STICKY_COL_WIDTH}px`, height: `${row.rowHeight}px` }}
                  title={`${row.profile.name} - ${row.profile.role}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <ContractorAvatar
                      avatarUrl={row.profile.avatarUrl}
                      name={row.profile.name}
                      color={row.profile.color || neonColor}
                      sizeClassName="w-8 h-8"
                      ringClassName="ring-1 shadow-xs"
                      showStatusDot
                      statusColor={row.profile.color || neonColor}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 truncate leading-tight transition-colors">
                        {row.profile.name}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate leading-tight font-medium">
                        {row.profile.role}
                      </p>
                    </div>
                  </div>

                  {onEditContractor && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditContractor(row.profile);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                      title="Editar foto y rol del responsable"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Track de Días y Tareas Continuas */}
                <div className="flex items-center relative h-full">
                  {daysList.map(d => (
                    <div
                      key={d.dateStr}
                      onClick={() => onQuickAddTask(row.profile.name, d.dateStr)}
                      className={`h-full border-r border-slate-200/50 dark:border-slate-800/30 shrink-0 cursor-pointer hover:bg-cyan-500/10 transition-colors ${
                        d.isWeekend ? 'bg-slate-100/40 dark:bg-slate-900/30' : ''
                      } ${d.isToday ? 'bg-cyan-500/10' : ''}`}
                      style={{ width: `${DAY_WIDTH}px` }}
                      title={`Clic para asignar tarea a ${row.profile.name} el ${d.dayNum}/${d.monthIndex + 1}`}
                    />
                  ))}

                  {/* Píldoras de Tareas Continuas */}
                  {row.positionedTasks.map(({ event: task, leftOffset, width, lane, taskStart, taskEnd }) => {
                    const alarms = getTaskAlarms(task, todayStr);
                    const isDone = task.completed || task.status === 'completed';

                    let pillClasses = 'bg-cyan-500 text-slate-950 shadow-cyan-500/25 border-cyan-400/50';
                    if (isDone) {
                      pillClasses = 'bg-emerald-500 text-white shadow-emerald-500/25 border-emerald-400/40';
                    } else if (alarms.isCriticalDelay) {
                      pillClasses = 'bg-rose-500 text-white shadow-rose-500/40 border-rose-300/60 animate-pulse';
                    } else if (alarms.isUpcomingDeadline || task.status === 'in_progress') {
                      pillClasses = 'bg-amber-400 text-slate-950 shadow-amber-500/25 border-amber-300/50';
                    } else if (task.type === 'alarm') {
                      pillClasses = 'bg-purple-600 text-white shadow-purple-500/30 border-purple-400/50';
                    }

                    return (
                      <div
                        key={task.id}
                        data-interactive="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task);
                        }}
                        className={`absolute h-6 rounded-xl text-[9.5px] font-black px-2 flex items-center justify-between gap-1.5 cursor-pointer transition-all shadow-md hover:scale-[1.02] active:scale-95 z-10 truncate border ${pillClasses}`}
                        style={{
                          left: `${leftOffset}px`,
                          width: `${width}px`,
                          top: `${8 + lane * 28}px`
                        }}
                        title={`${task.title} (${formatPMDate(taskStart)} al ${formatPMDate(taskEnd)}) • Clic para editar`}
                      >
                        <span className="truncate flex-1 font-bold">{task.title}</span>
                        {isDone && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                        {alarms.isCriticalDelay && <Flame className="w-3 h-3 shrink-0 text-white" />}
                        {task.type === 'alarm' && <AlertTriangle className="w-3 h-3 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {contractorRows.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                No hay cuadrillas configuradas en esta obra.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. FOOTER: GUÍA DE NAVEGACIÓN Y ACCIÓN */}
      <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-medium">
          <MoveHorizontal className="w-4 h-4 animate-pulse" />
          <span>Desliza lateralmente con el dedo para recorrer meses/semanas y verticalmente para más cuadrillas</span>
        </div>

        <span className="text-[11px] text-slate-400">
          💡 Haz clic en cualquier casillero de día para asignar una nueva tarea
        </span>
      </div>
    </div>
  );
}
