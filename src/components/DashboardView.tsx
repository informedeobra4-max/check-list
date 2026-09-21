import { useState } from 'react';
import {
  Building2,
  DoorClosed,
  RotateCcw,
  Plus,
  CircleCheck,
  Clock,
  Circle,
  FileText,
  ChevronRight,
  MapPin,
  Camera,
  Search,
  Trash2,
  FileSpreadsheet,
  Pencil,
  Info,
  FileCheck,
  Zap,
  Droplets,
  SlidersHorizontal,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Project, StatusFilter } from '../types';
import { calculateProjectProgress, isUnitCommonArea } from '../utils/calculations';
import { ProjectTimeline } from './ProjectTimeline';
import { ExecutiveDonutChart } from './ExecutiveDonutChart';
import { ExecutiveGaugeChart } from './ExecutiveGaugeChart';
import { ExecutiveTimeline } from './ExecutiveTimeline';
import { DEFAULT_LOGO_URL } from '../data/initialData';

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

  const totalUnits = projects.reduce((acc, p) => acc + p.units.length, 0);
  const totalDeptos = projects.reduce((acc, p) => acc + p.units.filter(u => !isUnitCommonArea(u)).length, 0);
  const totalCommon = projects.reduce((acc, p) => acc + p.units.filter(u => isUnitCommonArea(u)).length, 0);

  // Compute status and counts for each project
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
      const matchLoc = project.location.toLowerCase().includes(q);
      return matchName || matchLoc;
    }
    return true;
  });

  return (
    <section className="space-y-4">
      {/* Hero card with Brand Cover Logo */}
      <div
        className="rounded-2xl p-4 text-white shadow-xl border border-slate-700 relative overflow-hidden"
        style={presentationBg ? (presentationBg.startsWith('linear') ? { background: presentationBg } : { backgroundColor: presentationBg }) : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #020617)' }}
      >
        <div className="flex items-center gap-3.5 relative z-10">
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onClick={onOpenLogoEditor}
            title="Toca para cambiar logo o foto de marca"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-950/80 p-1.5 border-2 border-emerald-500 shadow-md shadow-emerald-950/50 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all">
              <img
                src={bannerLogoUrl || DEFAULT_LOGO_URL}
                alt="Logo Portada"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow">
              <Camera className="w-3 h-3" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black tracking-tight text-white leading-tight">
              Supervisión en Terreno
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Auditoría con fotos por gremios en departamentos y unidades.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <strong className="text-white">{projects.length}</strong> {projects.length === 1 ? 'Obra' : 'Obras'}
          </span>
          <span className="flex items-center gap-1">
            <DoorClosed className="w-3.5 h-3.5 text-amber-400" />
            <strong className="text-white">{totalDeptos}</strong> Deptos{totalCommon > 0 ? ` (${totalCommon} comunes)` : ''}
          </span>
          <button
            onClick={onResetData}
            className="text-slate-400 hover:text-white underline text-[11px] flex items-center gap-1"
            title="Restablecer datos de prueba de ejemplo"
          >
            <RotateCcw className="w-3 h-3" /> Reset Datos
          </button>
        </div>
      </div>

      {/* Section Header & New Project CTA */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Obras Registradas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona una obra para revisar departamentos</p>
        </div>
        <button
          onClick={onOpenNewProjectModal}
          className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black px-3 py-2 rounded-xl text-xs flex items-center shadow-md touch-target transition-all"
        >
          <Plus className="w-4 h-4 mr-1 stroke-[3]" /> Nueva Obra
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Buscar obra por nombre o dirección..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
        />
      </div>

      {/* Filter Chips - Executive Capsule Pills */}
      <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 shadow-sm touch-target ${
            filter === 'all'
              ? 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe] shadow-[0_0_12px_rgba(0,242,254,0.35)]'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:border-slate-500'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>All</span>
          <span className="bg-white/10 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {countAll}
          </span>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
            filter === 'completed'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:border-slate-500'
          }`}
        >
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Completed</span>
          <span className="bg-white/10 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {countCompleted}
          </span>
        </button>

        <button
          onClick={() => setFilter('in_progress')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
            filter === 'in_progress'
              ? 'bg-amber-500/20 text-amber-400 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:border-slate-500'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>In-Process</span>
          <span className="bg-white/10 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {countInProgress}
          </span>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
            filter === 'pending'
              ? 'bg-rose-500/20 text-rose-400 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:border-slate-500'
          }`}
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Pending</span>
          <span className="bg-white/10 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {countPending}
          </span>
        </button>
      </div>

      {/* Projects Grid - Executive Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 px-4 bg-slate-900/60 rounded-3xl border border-dashed border-slate-700">
            <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-base font-bold text-white">No se encontraron obras</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando el filtro de búsqueda o crea una obra.</p>
            <button
              onClick={onOpenNewProjectModal}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-[#00f2fe] text-slate-950 font-black rounded-xl text-xs shadow-lg"
            >
              + Crear Nueva Obra
            </button>
          </div>
        ) : (
          filteredProjects.map(({ project, progress, status }, idx) => {
            const unitCount = project.units.length;
            const deptosCount = project.units.filter(u => !isUnitCommonArea(u)).length;
            const commonCount = project.units.filter(u => isUnitCommonArea(u)).length;

            const isCritical = progress < 30;
            const delayMonths = progress >= 100 ? 0 : isCritical ? 3 : 2;
            const delayBadgeLabel = progress >= 100
              ? 'CRONOGRAMA EN FECHA'
              : isCritical
              ? 'DEMORA CRÍTICA: +3 MESES'
              : 'ESTADO: ATENCIÓN +2 MESES';

            const totalBudget = 2.6;
            const executedBudget = Number((1.2 + (progress * 0.014)).toFixed(1));
            const budgetPercent = Math.min(100, Math.round((executedBudget / totalBudget) * 100));

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`rounded-3xl p-5 sm:p-6 border transition-all duration-300 cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                  idx === 0
                    ? 'border-[#00f2fe]/70 shadow-[0_0_30px_rgba(0,242,254,0.15)] bg-gradient-to-b from-[#0c1425] to-[#080d1a]'
                    : 'border-slate-800/90 hover:border-[#00f2fe]/50 hover:shadow-[0_0_25px_rgba(0,242,254,0.1)] bg-[#0c1425]'
                } text-white`}
              >
                <div className="space-y-4">
                  {/* Upper Section: Project Info on Left, Large Cyan Donut on Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0 pr-1">
                      {/* Deptos & Comunes Badge */}
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/80">
                        {deptosCount} DEPTOS • {commonCount > 0 ? `${commonCount} COMUNES` : '0 COMUNES'}
                      </div>

                      {/* Project Name */}
                      <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-[#00f2fe] transition-colors truncate">
                        {project.name}
                      </h4>

                      {/* Location with Pin */}
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#00f2fe] flex-shrink-0" />
                        <span className="truncate">{project.location || 'Calle Agustín Alvarez 215'}</span>
                      </p>

                      {/* Avance General Technical Details */}
                      <div className="pt-2 text-[11px] text-slate-400 space-y-0.5">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          Avance General
                        </p>
                        <p className="truncate text-slate-300">
                          📋 {project.technicalNotes ? project.technicalNotes : 'Toda Ficha de Expediente y Rubros'}
                        </p>
                        {project.expedienteMunicipal && (
                          <p className="truncate text-slate-300">📁 Exp. Mun: {project.expedienteMunicipal}</p>
                        )}
                        {project.expedienteEdemsa && (
                          <p className="truncate text-slate-300">⚡ EDEMSA: {project.expedienteEdemsa}</p>
                        )}
                      </div>
                    </div>

                    {/* Big Glowing Cyan Donut Chart */}
                    <div className="flex-shrink-0 flex items-center justify-center p-1">
                      <ExecutiveDonutChart percentage={progress} size={130} strokeWidth={13} />
                    </div>
                  </div>

                  {/* Middle Section: Estado del Cronograma (Gauges) & Presupuesto Ejecutado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Left Box: Estado del Cronograma */}
                    <div className="bg-[#0f1b30]/80 rounded-2xl p-3 border border-slate-800/80 flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Estado del Cronograma
                      </span>

                      {/* Two Semicircle Gauge Speedometers */}
                      <div className="flex items-center justify-around py-0.5">
                        <ExecutiveGaugeChart
                          value={isCritical ? 75 : 45}
                          size={76}
                          status={isCritical ? 'critical' : 'warning'}
                        />
                        <ExecutiveGaugeChart
                          value={isCritical ? 65 : 55}
                          size={76}
                          status={isCritical ? 'critical' : 'warning'}
                        />
                      </div>

                      {/* Alert Tag */}
                      <div className={`mt-2 py-1 px-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 border ${
                        progress >= 100
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : isCritical
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}>
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{delayBadgeLabel}</span>
                      </div>
                    </div>

                    {/* Right Box: Presupuesto Ejecutado */}
                    <div className="bg-[#0f1b30]/80 rounded-2xl p-3 border border-slate-800/80 flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Presupuesto Ejecutado
                      </span>

                      <div className="flex items-center justify-between gap-3 my-auto py-1">
                        <div className="flex-1 space-y-2">
                          {/* Bullet Bar */}
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#00f2fe]"
                              style={{ width: `${budgetPercent}%` }}
                            />
                          </div>

                          {/* Currency Values */}
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
                        <div className="w-12 h-12 flex-shrink-0 relative">
                          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="6" />
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke={isCritical ? '#10b981' : '#f59e0b'}
                              strokeWidth="6"
                              strokeDasharray="88"
                              strokeDashoffset={88 - (budgetPercent / 100) * 88}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lower Section: Cronograma Detallado */}
                  <div className="bg-[#0f1b30]/60 rounded-2xl p-3 sm:p-3.5 border border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Cronograma Detallado
                    </span>
                    <ExecutiveTimeline
                      startDate={project.startDate}
                      estimatedEndDate={project.estimatedEndDate}
                      progress={progress}
                      delayMonths={delayMonths}
                    />
                  </div>
                </div>

                {/* Footer Controls & Actions */}
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
                        title="Editar fechas, expedientes y ficha técnica de la obra"
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
