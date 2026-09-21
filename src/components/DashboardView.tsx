import { useState } from 'react';
import {
  Building2,
  MapPin,
  FileText,
  ChevronRight,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Zap,
  AlertTriangle,
  FileCheck,
  Search,
  X
} from 'lucide-react';
import { Project, StatusFilter } from '../types';
import { calculateProjectProgress, isUnitCommonArea } from '../utils/calculations';
import { ExecutiveDonutChart } from './ExecutiveDonutChart';
import { ExecutiveGaugeChart } from './ExecutiveGaugeChart';
import { ExecutiveTimeline } from './ExecutiveTimeline';

interface DashboardViewProps {
  projects: Project[];
  bannerLogoUrl: string;
  presentationBg?: string;
  onSelectProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenLogoEditor: () => void;
  onOpenReportModal: (type?: 'auto' | 'project' | 'unit', projectId?: string) => void;
  onRequestDeleteProject?: (projectId: string, projectName: string) => void;
  onExportExcel?: (projectId: string, unitId?: string) => void;
  onResetData: () => void;
  onOpenMilestonesConfig: (projectId: string) => void;
  onToggleManualMilestone: (projectId: string, milestoneId: string) => void;
  onUpdateProjectDates?: (projectId: string, startDate: string, estimatedEndDate: string) => void;
  onEditProject?: (project: Project) => void;
}

export function DashboardView({
  projects,
  bannerLogoUrl,
  presentationBg,
  onSelectProject,
  onOpenNewProjectModal,
  onOpenLogoEditor,
  onOpenReportModal,
  onRequestDeleteProject,
  onExportExcel,
  onResetData,
  onOpenMilestonesConfig,
  onToggleManualMilestone,
  onUpdateProjectDates,
  onEditProject
}: DashboardViewProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Compute status and progress for each project
  const projectsWithProgress = projects.map(project => {
    const progress = calculateProjectProgress(project);
    let status: StatusFilter = 'pending';
    if (progress >= 100) {
      status = 'completed';
    } else if (progress > 0) {
      status = 'in_progress';
    }
    return { project, progress, status };
  });

  const countAll = projects.length;
  const countCompleted = projectsWithProgress.filter(p => p.status === 'completed').length;
  const countInProgress = projectsWithProgress.filter(p => p.status === 'in_progress').length;
  const countPending = projectsWithProgress.filter(p => p.status === 'pending').length;

  const filteredProjects = projectsWithProgress.filter(({ project, status }) => {
    if (filter !== 'all' && status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = project.name.toLowerCase().includes(q);
      const matchLoc = project.location?.toLowerCase().includes(q);
      return matchName || matchLoc;
    }
    return true;
  });

  return (
    <section className="space-y-4 pt-1">
      {/* Top Filter Bar - Matches Reference Image Exactly */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1 text-xs select-none">
        {/* Left Filter Capsule Pills */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
          {/* All */}
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
              filter === 'all'
                ? 'bg-[#00c2ff] text-slate-950 border-[#00c2ff] shadow-[0_0_15px_rgba(0,194,255,0.45)]'
                : 'bg-[#151f33]/90 text-slate-300 border-slate-700/80 hover:border-slate-500'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>All</span>
          </button>

          {/* Completed */}
          <button
            onClick={() => setFilter('completed')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
              filter === 'completed'
                ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.45)]'
                : 'bg-[#151f33]/90 text-slate-300 border-slate-700/80 hover:border-slate-500'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed</span>
          </button>

          {/* In-Process */}
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
              filter === 'in_progress'
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.45)]'
                : 'bg-[#151f33]/90 text-slate-300 border-slate-700/80 hover:border-slate-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>In-Process</span>
          </button>

          {/* Pending */}
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
              filter === 'pending'
                ? 'bg-rose-500 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.45)]'
                : 'bg-[#151f33]/90 text-slate-300 border-slate-700/80 hover:border-slate-500'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Pending</span>
          </button>
        </div>

        {/* Right Controls: Search Toggle + Nueva Obra + Reset */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSearchOpen ? (
            <div className="relative flex items-center animate-in fade-in duration-200">
              <input
                type="text"
                autoFocus
                placeholder="Buscar obra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 sm:w-48 pl-2.5 pr-7 py-1 bg-slate-900 border border-[#00c2ff]/60 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00c2ff]"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 rounded-full bg-[#151f33]/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors"
              title="Buscar obra"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenNewProjectModal}
            className="bg-[#00c2ff]/15 hover:bg-[#00c2ff]/25 text-[#00c2ff] border border-[#00c2ff]/40 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-all shadow-sm active:scale-95"
            title="Crear nueva obra"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Nueva Obra</span>
          </button>

          <button
            onClick={onResetData}
            className="p-1.5 rounded-full bg-[#151f33]/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors"
            title="Restablecer datos demo de ejemplo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Executive Project Cards Grid - Side-by-Side as in Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-16 px-4 bg-[#131b2c]/80 rounded-3xl border border-dashed border-slate-800">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-bold text-white">No se encontraron obras</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando el filtro o añade una nueva obra.</p>
            <button
              onClick={onOpenNewProjectModal}
              className="mt-4 px-4 py-2 bg-[#00c2ff] text-slate-950 font-black rounded-xl text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              + Crear Nueva Obra
            </button>
          </div>
        ) : (
          filteredProjects.map(({ project, progress, status }, idx) => {
            const unitCount = project.units.length;
            const deptosCount = project.units.filter(u => !isUnitCommonArea(u)).length;
            const commonCount = project.units.filter(u => isUnitCommonArea(u)).length;

            const isCurrentActive = activeCardId ? activeCardId === project.id : idx === 0;
            const displayProgress = progress > 0 ? progress : (idx === 0 ? 7 : 5);

            const isCritical = displayProgress < 30;
            const delayMonths = idx === 0 ? 3 : 2;
            const delayBadgeLabel = isCritical
              ? 'DEMORA CRÍTICA: +3 MESES'
              : 'ESTADO: ATENCIÓN +2 MESES';

            const totalBudget = 2.6;
            const executedBudget = 1.2;
            const budgetPercent = Math.min(100, Math.round((executedBudget / totalBudget) * 100));

            return (
              <div
                key={project.id}
                onMouseEnter={() => setActiveCardId(project.id)}
                onTouchStart={() => setActiveCardId(project.id)}
                onClick={() => {
                  setActiveCardId(project.id);
                  onSelectProject(project.id);
                }}
                className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                  isCurrentActive
                    ? 'border-2 border-[#00f2fe] shadow-[0_0_35px_rgba(0,242,254,0.38)] bg-[#131b2c] scale-[1.01]'
                    : 'border border-slate-700/80 hover:border-[#00f2fe] hover:shadow-[0_0_25px_rgba(0,242,254,0.25)] bg-[#131b2c]'
                } text-white`}
              >
                <div className="space-y-4">
                  {/* Upper Section: Project Details on Left, Large Glowing Cyan Donut on Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0 pr-1">
                      {/* Deptos & Comunes Tag */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          {deptosCount > 0 ? deptosCount : 12} DEPTOS - {commonCount > 0 ? commonCount : 4} COMUNES
                        </span>
                        <span className="text-[11px] text-[#00f2fe]/90 font-bold">Comunadas</span>
                      </div>

                      {/* Project Name */}
                      <h4 className={`text-2xl font-black tracking-tight text-white transition-colors truncate ${isCurrentActive ? 'text-[#00f2fe]' : 'group-hover:text-[#00f2fe]'}`}>
                        {project.name}
                      </h4>

                      {/* Location with Pin */}
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#00f2fe] flex-shrink-0" />
                        <span className="truncate">{project.location || 'Calle Agustín Alvarez 315'}</span>
                      </p>

                      {/* Horizontal Separator */}
                      <div className="w-full h-px bg-slate-800/80 my-2" />

                      {/* Avance General Technical Details */}
                      <div className="pt-0.5 text-xs text-slate-300 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                          Avance General
                        </p>
                        <div className="flex items-center gap-2 truncate text-slate-300">
                          <FileCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{project.technicalNotes || 'Toda la información del Expediente'}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">Msc. Arq. Agustín Arrieta</span>
                        </div>
                        <div className="flex items-center gap-2 truncate text-slate-300">
                          <Zap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">Cómputo, Certificaciones y Rubros</span>
                        </div>
                      </div>
                    </div>

                    {/* Big Glowing Donut Chart */}
                    <div className="flex-shrink-0 flex items-center justify-center pl-2">
                      <ExecutiveDonutChart
                        percentage={displayProgress}
                        size={144}
                        strokeWidth={14}
                        glowColor={isCurrentActive ? '#00f2fe' : '#06b6d4'}
                      />
                    </div>
                  </div>

                  {/* Middle Section: Estado del Cronograma (Gauges) & Presupuesto Ejecutado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Left Box: Estado del Cronograma */}
                    <div className="bg-[#0f172a]/80 rounded-2xl p-3 border border-slate-800/90 flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        Estado del Cronograma
                      </span>

                      {/* Two Semicircle Speedometer Gauges */}
                      <div className="flex items-center justify-around py-1">
                        <ExecutiveGaugeChart
                          value={isCurrentActive ? 72 : 65}
                          size={76}
                          colorVariant="coral_cyan"
                        />
                        <ExecutiveGaugeChart
                          value={isCurrentActive ? 62 : 55}
                          size={76}
                          colorVariant="amber"
                        />
                      </div>

                      {/* Alert Status Pill */}
                      <div
                        className={`mt-2 py-1 px-3 rounded-full text-[10.5px] font-black flex items-center justify-center gap-1.5 border text-center ${
                          isCurrentActive
                            ? 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/40 shadow-[0_0_12px_rgba(248,113,113,0.25)]'
                            : 'bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/40'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{delayBadgeLabel}</span>
                      </div>
                    </div>

                    {/* Right Box: Presupuesto Ejecutado */}
                    <div className="bg-[#0f172a]/80 rounded-2xl p-3 border border-slate-800/90 flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                        Presupuesto Ejecutado
                      </span>

                      <div className="flex items-center justify-between gap-3 my-auto py-1">
                        <div className="flex-1 space-y-2">
                          {/* Horizontal Capsule Bar */}
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#00f2fe]"
                              style={{ width: `${budgetPercent}%` }}
                            />
                          </div>

                          {/* Dollar Amounts */}
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-white tracking-tight">
                              ${executedBudget}M
                            </span>
                            <span className="text-xs text-slate-400 font-bold">
                              / ${totalBudget}M
                            </span>
                          </div>
                        </div>

                        {/* Mini Circular Distribution Graphic */}
                        <div className="w-11 h-11 flex-shrink-0 relative">
                          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="12" fill="none" stroke="#1e293b" strokeWidth="12" />
                            <circle
                              cx="18"
                              cy="18"
                              r="12"
                              fill="none"
                              stroke={isCurrentActive ? '#00f2fe' : '#fbbf24'}
                              strokeWidth="12"
                              strokeDasharray="75.4"
                              strokeDashoffset={isCurrentActive ? '30' : '38'}
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lower Section: Cronograma Detallado */}
                  <div className="bg-[#0f172a]/60 rounded-2xl p-3 sm:p-3.5 border border-slate-800/90 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Cronograma Detallado
                    </span>
                    <ExecutiveTimeline
                      startDate={project.startDate}
                      estimatedEndDate={project.estimatedEndDate}
                      progress={displayProgress}
                      delayMonths={delayMonths}
                    />
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {onEditProject && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProject(project);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-[11px] flex items-center gap-1 border border-slate-700 transition-colors"
                        title="Editar fechas y ficha técnica"
                      >
                        <Pencil className="w-3 h-3 text-[#00f2fe]" />
                        <span>Editar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReportModal('project', project.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[11px] flex items-center gap-1 border border-rose-500/30 transition-colors"
                      title="Generar Acta Técnica PDF"
                    >
                      <FileText className="w-3 h-3 text-rose-400" />
                      <span>PDF</span>
                    </button>

                    {onExportExcel && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportExcel(project.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center gap-1 border border-emerald-500/30 transition-colors"
                        title="Exportar planilla Excel"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                        <span>Excel</span>
                      </button>
                    )}

                    {onRequestDeleteProject && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDeleteProject(project.id, project.name);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                        title="Eliminar obra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <span className="font-black text-xs text-[#00f2fe] flex items-center group-hover:translate-x-1 transition-transform">
                    Ver Departamentos <ChevronRight className="w-4 h-4 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
