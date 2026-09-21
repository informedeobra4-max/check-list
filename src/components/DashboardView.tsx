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
  FileSpreadsheet
} from 'lucide-react';
import { Project, StatusFilter } from '../types';
import { calculateProjectProgress, isUnitCommonArea } from '../utils/calculations';
import { ProjectTimeline } from './ProjectTimeline';
import { AnimatedCircularProgress } from './AnimatedCircularProgress';
import { Pencil, Info, FileCheck, Zap, Droplets } from 'lucide-react';
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

      {/* Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 shadow-sm touch-target ${
            filter === 'all'
              ? 'bg-amber-500 text-slate-950 border-amber-500'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <span>Todos</span>
          <span className="bg-slate-950/15 dark:bg-slate-100/15 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {countAll}
          </span>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
            filter === 'completed'
              ? 'bg-amber-500 text-slate-950 border-amber-500'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <CircleCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Completado</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-black text-slate-700 dark:text-slate-300">
            {countCompleted}
          </span>
        </button>

        <button
          onClick={() => setFilter('in_progress')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
            filter === 'in_progress'
              ? 'bg-amber-500 text-slate-950 border-amber-500'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>En curso</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-black text-slate-700 dark:text-slate-300">
            {countInProgress}
          </span>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
            filter === 'pending'
              ? 'bg-amber-500 text-slate-950 border-amber-500'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <Circle className="w-3.5 h-3.5 text-slate-400" />
          <span>Pendiente</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-black text-slate-700 dark:text-slate-300">
            {countPending}
          </span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No se encontraron obras</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Prueba cambiando el filtro de búsqueda o crea una obra.</p>
            <button
              onClick={onOpenNewProjectModal}
              className="mt-3 px-3 py-1.5 bg-amber-500 text-slate-950 font-black rounded-lg text-xs"
            >
              + Crear Nueva Obra
            </button>
          </div>
        ) : (
          filteredProjects.map(({ project, progress, status }) => {
            const unitCount = project.units.length;
            const deptosCount = project.units.filter(u => !isUnitCommonArea(u)).length;
            const commonCount = project.units.filter(u => isUnitCommonArea(u)).length;

            let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
            let statusLabel = 'Pendiente (0%)';
            if (progress >= 100) {
              badgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
              statusLabel = 'Completado (100%)';
            } else if (progress > 0) {
              badgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800';
              statusLabel = `En curso (${progress}%)`;
            }

            const hasTechInfo = !!(
              project.expedienteMunicipal ||
              project.expedienteEdemsa ||
              project.expedienteAysam ||
              (project.customServices && project.customServices.length > 0) ||
              project.technicalNotes
            );

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`rounded-2xl p-4 shadow-sm border hover:border-amber-400 dark:hover:border-amber-500 active:bg-slate-50 dark:active:bg-slate-850 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                  presentationBg
                    ? 'text-white border-slate-700/60 shadow-lg'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
                style={presentationBg ? (presentationBg.startsWith('linear') ? { background: presentationBg } : { backgroundColor: presentationBg }) : undefined}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeColor} border`}>
                          {deptosCount} {deptosCount === 1 ? 'Depto' : 'Deptos'}{commonCount > 0 ? ` • ${commonCount} Común${commonCount > 1 ? 'es' : ''}` : ''}
                        </span>
                        <span className={`text-[10px] font-semibold ${presentationBg ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          • {statusLabel}
                        </span>
                      </div>

                      <h4 className={`text-base font-black tracking-tight leading-snug group-hover:text-amber-400 transition-colors ${presentationBg ? 'text-white' : 'text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400'}`}>
                        {project.name}
                      </h4>

                      <p className={`text-xs flex items-center ${presentationBg ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        <MapPin className={`w-3.5 h-3.5 mr-1 flex-shrink-0 ${presentationBg ? 'text-amber-400' : 'text-amber-600 dark:text-amber-400'}`} />
                        <span className="truncate">{project.location || 'Obra en construcción'}</span>
                      </p>
                    </div>

                    {/* Animated Circular Progress for Project */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <AnimatedCircularProgress
                        percentage={progress}
                        size={60}
                        strokeWidth={5}
                        color="#10B981"
                      />
                      <span className={`text-[9px] font-bold uppercase mt-0.5 tracking-wider ${presentationBg ? 'text-slate-300' : 'text-slate-400'}`}>
                        Consolidado
                      </span>
                    </div>
                  </div>

                  {/* Ficha Técnica y Administrativa Card */}
                  <div className={`mt-3 p-2.5 rounded-xl border text-xs space-y-1 ${
                    presentationBg
                      ? 'bg-black/30 border-white/10 text-slate-200'
                      : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800'
                  }`}>
                    <div className={`flex items-center justify-between text-[11px] font-bold ${presentationBg ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>
                      <span className={`flex items-center gap-1 ${presentationBg ? 'text-amber-300' : 'text-amber-700 dark:text-amber-400'}`}>
                        <FileCheck className="w-3.5 h-3.5 text-amber-500" />
                        Ficha Técnica & Expedientes
                      </span>
                      {onEditProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(project);
                          }}
                          className="text-[10px] font-black text-amber-500 hover:underline flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10"
                        >
                          <Pencil className="w-2.5 h-2.5" /> Editar
                        </button>
                      )}
                    </div>

                    {hasTechInfo ? (
                      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-0.5 ${presentationBg ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
                        {project.expedienteMunicipal && (
                          <div className="truncate">
                            <strong className={presentationBg ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'}>Mun:</strong> {project.expedienteMunicipal}
                          </div>
                        )}
                        {project.expedienteEdemsa && (
                          <div className="truncate">
                            <strong className={presentationBg ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'}>EDEMSA:</strong> {project.expedienteEdemsa}
                          </div>
                        )}
                        {project.expedienteAysam && (
                          <div className="truncate">
                            <strong className={presentationBg ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'}>AYSAM:</strong> {project.expedienteAysam}
                          </div>
                        )}
                        {project.customServices && project.customServices.map(srv => (
                          <div key={srv.id} className="truncate">
                            <strong className={presentationBg ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'}>{srv.name.split('(')[0].trim()}:</strong> {srv.number}
                          </div>
                        ))}
                        {project.technicalNotes && (
                          <div className={`truncate sm:col-span-2 italic ${presentationBg ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            &ldquo;{project.technicalNotes}&rdquo;
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className={`text-[10px] italic ${presentationBg ? 'text-slate-400' : 'text-slate-400'}`}>
                        Sin expedientes cargados (Toca &apos;Editar&apos; para agregar Exp. Municipal, EDEMSA, AYSAM o nuevos servicios)
                      </p>
                    )}
                  </div>

                  {/* Línea de Tiempo e Hitos Críticos con Alarmas Rojas */}
                  <div className="mt-3">
                    <ProjectTimeline
                      project={project}
                      compact={true}
                      onOpenMilestonesConfig={onOpenMilestonesConfig}
                      onToggleManualMilestone={onToggleManualMilestone}
                      onUpdateProjectDates={onUpdateProjectDates}
                    />
                  </div>
                </div>

                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
                  presentationBg
                    ? 'border-white/10 text-slate-300'
                    : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <span className={`flex items-center text-[11px] font-medium ${presentationBg ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    <CircleCheck className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Supervisión activa
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReportModal('project', project.id);
                      }}
                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-[11px] flex items-center gap-1 transition-colors"
                      title="Generar Acta Técnica PDF de esta obra"
                    >
                      <FileText className="w-3 h-3 text-rose-600" />
                      <span>PDF</span>
                    </button>

                    {onExportExcel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportExcel(project.id);
                        }}
                        className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[11px] flex items-center gap-1 transition-colors"
                        title="Descargar Planilla Excel con casillas para tildar a mano"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        <span>Excel</span>
                      </button>
                    )}

                    {onRequestDeleteProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDeleteProject(project.id, project.name);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Eliminar esta obra (Clave 2600)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className={`font-black text-xs flex items-center group-hover:text-amber-400 transition-colors ml-1 ${presentationBg ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      Abrir <ChevronRight className="w-4 h-4 ml-0.5 text-amber-500" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
