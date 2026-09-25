import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  User,
  Users,
  Search,
  Filter,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Flame,
  CheckSquare,
  Square,
  ListTodo,
  TrendingUp,
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  FolderKanban
} from 'lucide-react';
import { Project, ProjectCalendarEvent, PMSubtask, PMTaskStatus, CalendarEventType } from '../types';
import { getTodayString, getTaskAlarms, calculateProjectPMStats, formatPMDate, getDaysDiff } from '../utils/pmCalculations';
import { hexToRgba } from '../utils/calculations';

interface ProjectManagerModalProps {
  isOpen: boolean;
  project: Project | null;
  initialTab?: 'dashboard' | 'tasks' | 'calendar';
  initialDate?: string;
  selectedTaskId?: string;
  neonColor?: string;
  onClose: () => void;
  onSaveTask: (projectId: string, task: ProjectCalendarEvent) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
  onToggleTaskStatus?: (projectId: string, taskId: string, newStatus: PMTaskStatus) => void;
  onToggleSubtask?: (projectId: string, taskId: string, subtaskId: string) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS_ES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function ProjectManagerModal({
  isOpen,
  project,
  initialTab = 'dashboard',
  initialDate,
  selectedTaskId,
  neonColor = '#00f2fe',
  onClose,
  onSaveTask,
  onDeleteTask,
  onToggleTaskStatus,
  onToggleSubtask,
  onShowToast
}: ProjectManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'calendar'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'upcoming' | 'in_progress' | 'pending' | 'completed'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Form Drawer / Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedRole, setAssignedRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<CalendarEventType>('task');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<PMTaskStatus>('pending');
  const [subtasks, setSubtasks] = useState<PMSubtask[]>([]);
  const [newSubtaskDraft, setNewSubtaskDraft] = useState('');

  // Calendar tab navigation
  const todayStr = useMemo(() => getTodayString(), []);
  const [calDate, setCalDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calSelectedDateStr, setCalSelectedDateStr] = useState<string>(initialDate || todayStr);

  // Stats calculation
  const stats = useMemo(() => {
    return calculateProjectPMStats(project?.calendarEvents || [], todayStr);
  }, [project?.calendarEvents, todayStr]);

  // List of unique assignees in this project
  const availableAssignees = useMemo(() => {
    const set = new Set<string>();
    (project?.calendarEvents || []).forEach(t => {
      if (t.assignedTo?.trim()) set.add(t.assignedTo.trim());
    });
    return Array.from(set);
  }, [project?.calendarEvents]);

  // Open editor with prefilled data or reset
  const handleOpenNewTask = (presetDate?: string) => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setAssignedTo(project?.director || '');
    setAssignedRole('Director de Obra');
    setStartDate(todayStr);
    setDeadlineDate(presetDate || todayStr);
    setTime('');
    setType('task');
    setPriority('medium');
    setStatus('pending');
    setSubtasks([]);
    setNewSubtaskDraft('');
    setIsEditorOpen(true);
  };

  const handleEditTask = (task: ProjectCalendarEvent) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setAssignedTo(task.assignedTo || '');
    setAssignedRole(task.assignedRole || '');
    setStartDate(task.startDate || '');
    setDeadlineDate(task.date || '');
    setTime(task.time || '');
    setType(task.type || 'task');
    setPriority(task.priority || 'medium');
    setStatus(task.status || (task.completed ? 'completed' : 'pending'));
    setSubtasks(task.subtasks ? [...task.subtasks] : []);
    setNewSubtaskDraft('');
    setIsEditorOpen(true);
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskDraft.trim();
    if (!trimmed) return;
    const newSub: PMSubtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: trimmed,
      completed: false
    };
    setSubtasks(prev => [...prev, newSub]);
    setNewSubtaskDraft('');
  };

  const handleRemoveSubtask = (subId: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== subId));
  };

  const handleToggleSubtaskInForm = (subId: string) => {
    setSubtasks(prev => prev.map(s => {
      if (s.id !== subId) return s;
      const nextCompleted = !s.completed;
      return {
        ...s,
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date().toISOString() : undefined
      };
    }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      onShowToast('Ingresa un título para la tarea', 'AlertCircle');
      return;
    }

    const isAllSubtasksDone = subtasks.length > 0 && subtasks.every(s => s.completed);
    const finalStatus: PMTaskStatus = isAllSubtasksDone && status !== 'completed' ? 'completed' : status;
    const isCompleted = finalStatus === 'completed';

    const nowIso = new Date().toISOString();
    const existingTask = editingTaskId
      ? (project.calendarEvents || []).find(t => t.id === editingTaskId)
      : null;

    const taskPayload: ProjectCalendarEvent = {
      id: editingTaskId || `pmtask_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      projectId: project.id,
      title: cleanTitle,
      description: description.trim() || undefined,
      assignedTo: assignedTo.trim() || undefined,
      assignedRole: assignedRole.trim() || undefined,
      startDate: startDate || undefined,
      date: deadlineDate || todayStr,
      time: time || undefined,
      type,
      priority,
      status: finalStatus,
      completed: isCompleted,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      createdAt: existingTask?.createdAt || nowIso,
      updatedAt: nowIso
    };

    onSaveTask(project.id, taskPayload);
    setIsEditorOpen(false);
    onShowToast(
      editingTaskId
        ? 'Tarea actualizada en Nube y Google Drive'
        : '¡Tarea guardada en Project Manager y Drive!',
      'Check'
    );
  };

  const handleDelete = (task: ProjectCalendarEvent) => {
    if (!project) return;
    if (confirm(`¿Eliminar la tarea "${task.title}" del Project Manager?`)) {
      onDeleteTask(project.id, task.id);
      if (editingTaskId === task.id) {
        setIsEditorOpen(false);
      }
      onShowToast('Tarea eliminada', 'Trash2');
    }
  };

  // Filtered Tasks for the "tasks" tab
  const filteredTasks = useMemo(() => {
    return (project?.calendarEvents || []).filter(task => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesAssignee = (task.assignedTo || '').toLowerCase().includes(q);
        const matchesSubtask = (task.subtasks || []).some(s => s.title.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesAssignee && !matchesSubtask) return false;
      }

      // Assignee filter
      if (assigneeFilter !== 'all') {
        if ((task.assignedTo || '').trim() !== assigneeFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        if (task.priority !== priorityFilter) return false;
      }

      // Status / Alarm filter
      const alarms = getTaskAlarms(task, todayStr);
      const isDone = task.completed || task.status === 'completed';

      if (statusFilter === 'critical') {
        return alarms.isCriticalDelay;
      }
      if (statusFilter === 'upcoming') {
        return alarms.isUpcomingDeadline;
      }
      if (statusFilter === 'in_progress') {
        return !isDone && (task.status === 'in_progress');
      }
      if (statusFilter === 'pending') {
        return !isDone && (!task.status || task.status === 'pending');
      }
      if (statusFilter === 'completed') {
        return isDone;
      }

      return true;
    });
  }, [project?.calendarEvents, searchQuery, assigneeFilter, priorityFilter, statusFilter, todayStr]);

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* TOP HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-slate-950 shadow-md shrink-0"
              style={{ backgroundColor: neonColor }}
            >
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Project Manager Profesional
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Google Drive & Cloud Sync
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white truncate">
                {project.name}
              </h2>
            </div>
          </div>

          {/* TAB SELECTOR & CLOSE */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all relative ${
                  activeTab === 'tasks'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span>Tareas ({stats.totalTasks})</span>
                {stats.criticalDelayCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calendario</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNewTask()}
              className="px-3.5 py-1.5 rounded-xl font-black text-xs text-slate-950 flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
              style={{ backgroundColor: neonColor }}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Nueva Tarea</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cerrar Project Manager"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-950/40">
          
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* TOP KPI CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Total */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-cyan-400" /> Total Tareas
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{stats.totalTasks}</span>
                    <span className="text-[10px] text-slate-500 font-bold">100%</span>
                  </div>
                </div>

                {/* Retraso Crítico (Intense Red Glow) */}
                <div
                  onClick={() => {
                    setStatusFilter('critical');
                    setActiveTab('tasks');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                    stats.criticalDelayCount > 0
                      ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/50'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <Flame className={`w-3.5 h-3.5 ${stats.criticalDelayCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                    Retraso Crítico
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={`text-2xl font-black ${stats.criticalDelayCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                      {stats.criticalDelayCount}
                    </span>
                    {stats.criticalDelayCount > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        ¡Urgente!
                      </span>
                    )}
                  </div>
                </div>

                {/* Cierre Próximo */}
                <div
                  onClick={() => {
                    setStatusFilter('upcoming');
                    setActiveTab('tasks');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                    stats.upcomingDeadlineCount > 0
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Cierre Próximo
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={`text-2xl font-black ${stats.upcomingDeadlineCount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {stats.upcomingDeadlineCount}
                    </span>
                    <span className="text-[10px] text-slate-400">&le; 72hs</span>
                  </div>
                </div>

                {/* Inicio Vencido */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-400" /> Inicio Vencido
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={`text-2xl font-black ${stats.overdueStartCount > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                      {stats.overdueStartCount}
                    </span>
                    <span className="text-[10px] text-slate-500">Pendientes</span>
                  </div>
                </div>

                {/* En Curso */}
                <div
                  onClick={() => {
                    setStatusFilter('in_progress');
                    setActiveTab('tasks');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-slate-700 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-blue-400" /> En Curso
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-blue-400">{stats.inProgressTasks}</span>
                    <span className="text-[10px] text-slate-500">Operativas</span>
                  </div>
                </div>

                {/* Finalizadas */}
                <div
                  onClick={() => {
                    setStatusFilter('completed');
                    setActiveTab('tasks');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-emerald-500/40 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Finalizadas
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-400">{stats.completedTasks}</span>
                    <span className="text-[10px] font-bold text-emerald-500">{stats.completionRatePct}%</span>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW: SUBTASKS PROGRESS & ASSIGNEES BREAKDOWN */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* GLOBAL SUBTASKS PROGRESS */}
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-cyan-400" /> Avance Global de Subtareas
                      </span>
                      <span className="text-xs font-black text-white">{stats.subtaskProgressPct}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Subtareas completadas en el checklist general de la obra.
                    </p>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/60">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stats.subtaskProgressPct}%`,
                          backgroundColor: neonColor
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>{stats.completedSubtasks} de {stats.totalSubtasks} subtareas hechas</span>
                    <span className="font-bold text-slate-300">
                      {stats.totalSubtasks - stats.completedSubtasks} pendientes
                    </span>
                  </div>
                </div>

                {/* ASSIGNEES WORKLOAD BREAKDOWN */}
                <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" /> Carga de Trabajo por Responsable
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {Object.keys(stats.byAssignee).length} involucrados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {Object.entries(stats.byAssignee).map(([name, data]) => (
                      <div
                        key={name}
                        onClick={() => {
                          setAssigneeFilter(name);
                          setActiveTab('tasks');
                        }}
                        className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">{name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{data.role || 'Responsable'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          {data.critical > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {data.critical} crit.
                            </span>
                          )}
                          <span className="text-xs font-black text-slate-300">
                            {data.completed}/{data.total}
                          </span>
                        </div>
                      </div>
                    ))}

                    {Object.keys(stats.byAssignee).length === 0 && (
                      <p className="text-xs text-slate-500 py-4 col-span-2 text-center">
                        No hay tareas asignadas aún en esta obra.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM: IMMEDIATE ATTENTION LIST (CRITICAL DELAYS & UPCOMING) */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase text-slate-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" /> Tareas que Requieren Atención Inmediata
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tasks')}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    Ver todas las tareas <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {stats.criticalTasks.slice(0, 4).map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleEditTask(task)}
                      className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/40 hover:border-rose-500 cursor-pointer transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-black text-[10px] border border-rose-500/30 shrink-0">
                          🚨 Retraso Crítico
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{task.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            Asignado: {task.assignedTo || 'Sin asignar'} • Fecha límite: {formatPMDate(task.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-black text-rose-400">
                          +{getDaysDiff(todayStr, task.date)} días
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  ))}

                  {stats.upcomingTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleEditTask(task)}
                      className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500 cursor-pointer transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/30 shrink-0">
                          ⏰ Vence Pronto
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{task.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            Asignado: {task.assignedTo || 'Sin asignar'} • Fecha límite: {formatPMDate(task.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-amber-400">
                          en {getDaysDiff(task.date, todayStr)} días
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  ))}

                  {stats.criticalTasks.length === 0 && stats.upcomingTasks.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs font-medium">
                      🎉 ¡Excelente! No hay tareas con retraso crítico ni cierres urgentes en esta obra.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TASKS & SUBTASKS LIST */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 animate-fade-in">
              {/* FILTERS & SEARCH BAR */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por tarea, subtarea o responsable..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Filter Assignee */}
                    <select
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      <option value="all">Todos los Responsables</option>
                      {availableAssignees.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>

                    {/* Filter Priority */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      <option value="all">Toda Prioridad</option>
                      <option value="urgent">Urgente</option>
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>
                </div>

                {/* STATUS FILTER PILLS */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
                  {[
                    { id: 'all', label: `Todas (${stats.totalTasks})` },
                    { id: 'critical', label: `🚨 Críticas (${stats.criticalDelayCount})`, alert: stats.criticalDelayCount > 0 },
                    { id: 'upcoming', label: `⏰ Por Vencer (${stats.upcomingDeadlineCount})` },
                    { id: 'in_progress', label: `En Curso (${stats.inProgressTasks})` },
                    { id: 'pending', label: `Pendientes (${stats.pendingTasks})` },
                    { id: 'completed', label: `Finalizadas (${stats.completedTasks})` }
                  ].map(pill => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setStatusFilter(pill.id as any)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                        statusFilter === pill.id
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : pill.alert
                            ? 'bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:bg-rose-900/40'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TASKS LIST */}
              <div className="space-y-3">
                {filteredTasks.map(task => {
                  const alarms = getTaskAlarms(task, todayStr);
                  const isDone = task.completed || task.status === 'completed';
                  const subCount = task.subtasks?.length || 0;
                  const subDoneCount = task.subtasks?.filter(s => s.completed).length || 0;

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        alarms.isCriticalDelay
                          ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
                          : isDone
                            ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* CARD TOP ROW */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {alarms.isCriticalDelay && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                🚨 Retraso Crítico (+{alarms.daysOverdue}d)
                              </span>
                            )}
                            {alarms.isUpcomingDeadline && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                ⏰ Vence en {alarms.daysUntilDeadline}d
                              </span>
                            )}
                            {alarms.isOverdueStart && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                ⚠️ Inicio Vencido
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                              {task.type === 'alarm' ? 'Alarma' : task.type === 'event' ? 'Evento' : 'Tarea'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300'
                                : task.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-800 text-slate-400'
                            }`}>
                              {task.priority || 'media'}
                            </span>
                          </div>

                          <h4 className={`text-sm font-black text-white ${isDone ? 'line-through text-slate-500' : ''}`}>
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* STATUS SELECTOR & ACTIONS */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Quick Status Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onToggleTaskStatus) {
                                const nextStatus: PMTaskStatus = isDone ? 'pending' : 'completed';
                                onToggleTaskStatus(project.id, task.id, nextStatus);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 text-slate-500" />}
                            <span>{isDone ? 'Finalizada' : 'Marcar Fin'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Editar tarea"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* CARD META ROW: ASSIGNEE & DATES */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                            <User className="w-3.5 h-3.5 text-cyan-400" />
                            {task.assignedTo || 'Sin responsable'}
                            {task.assignedRole && <span className="text-slate-500 font-normal">({task.assignedRole})</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px]">
                          {task.startDate && (
                            <span>Inicio: <strong className="text-slate-300">{formatPMDate(task.startDate)}</strong></span>
                          )}
                          <span>Límite: <strong className={alarms.isCriticalDelay ? 'text-rose-400' : 'text-slate-300'}>{formatPMDate(task.date)}</strong></span>
                          {task.time && <span>({task.time} hs)</span>}
                        </div>
                      </div>

                      {/* SUBTASKS CHECKLIST INLINE */}
                      {subCount > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/60 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span className="font-bold flex items-center gap-1.5">
                              <CheckSquare className="w-3 h-3 text-cyan-400" />
                              Subtareas ({subDoneCount}/{subCount})
                            </span>
                            <span className="font-black text-slate-300">
                              {Math.round((subDoneCount / subCount) * 100)}%
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {task.subtasks?.map(sub => (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  if (onToggleSubtask) {
                                    onToggleSubtask(project.id, task.id, sub.id);
                                  }
                                }}
                                className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-left transition-colors"
                              >
                                {sub.completed ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                )}
                                <span className={`text-[11px] truncate ${sub.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                  {sub.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                    No se encontraron tareas con los filtros seleccionados.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRATED OBRA CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CALENDAR MONTH GRID */}
                <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-black uppercase text-white">
                        {MONTH_NAMES_ES[calDate.getMonth()]} {calDate.getFullYear()}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          setCalDate(new Date(now.getFullYear(), now.getMonth(), 1));
                          setCalSelectedDateStr(todayStr);
                        }}
                        className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* WEEKDAYS */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-500 uppercase mb-2">
                    {WEEKDAYS_ES.map((d, i) => (
                      <div key={i} className="py-1">{d}</div>
                    ))}
                  </div>

                  {/* DAYS MATRIX */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const year = calDate.getFullYear();
                      const month = calDate.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const firstDayDay = new Date(year, month, 1).getDay();
                      const startOffset = firstDayDay === 0 ? 6 : firstDayDay - 1;

                      const cells = [];
                      for (let i = 0; i < startOffset; i++) {
                        cells.push(<div key={`empty_${i}`} className="h-10 rounded-xl bg-slate-950/20"></div>);
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const dayEvents = (project.calendarEvents || []).filter(e => e.date === dateStr);
                        const hasCritical = dayEvents.some(e => getTaskAlarms(e, todayStr).isCriticalDelay);
                        const isSelected = dateStr === calSelectedDateStr;
                        const isToday = dateStr === todayStr;

                        cells.push(
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setCalSelectedDateStr(dateStr)}
                            className={`h-11 rounded-xl p-1 text-left flex flex-col justify-between transition-all border ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-950/30'
                                : isToday
                                  ? 'border-amber-500/50 bg-slate-800/80'
                                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                            }`}
                          >
                            <span className={`text-[11px] font-bold ${isToday ? 'text-amber-400 font-black' : 'text-slate-300'}`}>
                              {d}
                            </span>

                            <div className="flex items-center gap-0.5">
                              {hasCritical && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                              )}
                              {dayEvents.length > 0 && !hasCritical && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                              )}
                            </div>
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>

                {/* SELECTED DAY AGENDA */}
                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400">Agenda del Día</span>
                        <h4 className="text-xs font-black text-white">{formatPMDate(calSelectedDateStr)}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenNewTask(calSelectedDateStr)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
                      >
                        + Tarea
                      </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                      {(project.calendarEvents || [])
                        .filter(e => e.date === calSelectedDateStr)
                        .map(evt => {
                          const alarms = getTaskAlarms(evt, todayStr);
                          return (
                            <div
                              key={evt.id}
                              onClick={() => handleEditTask(evt)}
                              className={`p-2.5 rounded-xl border cursor-pointer hover:border-slate-600 transition-all ${
                                alarms.isCriticalDelay
                                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                                  : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase">{evt.type}</span>
                                {evt.time && <span className="text-[10px] text-slate-400">{evt.time} hs</span>}
                              </div>
                              <p className="text-xs font-black text-white truncate mt-0.5">{evt.title}</p>
                              {evt.assignedTo && (
                                <p className="text-[10px] text-slate-400 mt-1">Resp: {evt.assignedTo}</p>
                              )}
                            </div>
                          );
                        })}

                      {(project.calendarEvents || []).filter(e => e.date === calSelectedDateStr).length === 0 && (
                        <p className="text-xs text-slate-500 py-8 text-center">
                          No hay tareas para esta fecha.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* TASK CREATION / EDITING DRAWER / MODAL */}
        {isEditorOpen && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  {editingTaskId ? 'Editar Tarea de Project Manager' : 'Cargar Nueva Tarea en la Obra'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {/* Título */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Título de la Tarea / Evento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Inspección estructural losa piso 2 o Certificación de plomería"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                {/* Responsable & Rol */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Responsable / Encargado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Arq. Agustín Arrieta o Capataz"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Rol o Especialidad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Director de Obra, Gremio Eléctrico"
                      value={assignedRole}
                      onChange={(e) => setAssignedRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* Fechas: Inicio & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Fecha Límite (Deadline) *
                    </label>
                    <input
                      type="date"
                      required
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Hora (opcional)
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* Tipo, Prioridad y Estado */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Tipo
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="task">Tarea Técnica</option>
                      <option value="alarm">Alarma / Vencimiento</option>
                      <option value="event">Evento / Reunión</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="urgent">Urgente</option>
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Estado
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En Curso</option>
                      <option value="blocked">Bloqueada</option>
                      <option value="completed">Finalizada</option>
                    </select>
                  </div>
                </div>

                {/* Subtareas Checklist Manager */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2">
                    Subtareas / Checklist de la Tarea ({subtasks.length})
                  </label>

                  {/* Add Subtask Input */}
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Escribe una subtarea y presiona Enter..."
                      value={newSubtaskDraft}
                      onChange={(e) => setNewSubtaskDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold"
                    >
                      + Agregar
                    </button>
                  </div>

                  {/* Subtask Items */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {subtasks.map(sub => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleSubtaskInForm(sub.id)}
                          className="flex items-center gap-2 text-left min-w-0 flex-1"
                        >
                          {sub.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <span className={`text-xs truncate ${sub.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {sub.title}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(sub.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Descripción / Notas */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Descripción o Instrucciones Técnicas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre materiales, gremio, o condiciones de entrega..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  {editingTaskId && (
                    <button
                      type="button"
                      onClick={() => {
                        const t = (project.calendarEvents || []).find(e => e.id === editingTaskId);
                        if (t) handleDelete(t);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40"
                    >
                      Eliminar Tarea
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 shadow-md active:scale-95 transition-all"
                      style={{ backgroundColor: neonColor }}
                    >
                      {editingTaskId ? 'Guardar Cambios' : 'Crear Tarea'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
