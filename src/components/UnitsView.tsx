import { useState } from 'react';
import {
  Layers,
  DoorOpen,
  Plus,
  CircleCheck,
  Clock,
  Circle,
  FileText,
  ArrowRight,
  Wrench,
  BrickWall,
  Pipette,
  Zap,
  Maximize2,
  Pencil,
  Building2,
  Trash2,
  FileSpreadsheet,
  Compass,
  FileCheck
} from 'lucide-react';
import { Project, Unit, StatusFilter } from '../types';
import { calculateUnitProgress, getUnitItemCounts, calculateProjectProgress, isUnitCommonArea } from '../utils/calculations';
import { MASTER_TRADES_TEMPLATE } from '../data/initialData';
import { ProjectTimeline } from './ProjectTimeline';
import { AnimatedCircularProgress } from './AnimatedCircularProgress';

interface UnitsViewProps {
  project: Project;
  presentationBg?: string;
  onSelectUnit: (unitId: string) => void;
  onOpenNewUnitModal: () => void;
  onOpenReportModal: (type?: 'auto' | 'project' | 'unit', projectId?: string, unitId?: string) => void;
  onEditUnit: (unit: Unit) => void;
  onRequestDeleteUnit?: (unitId: string, unitName: string) => void;
  onRequestDeleteProject?: (projectId: string, projectName: string) => void;
  onExportExcel?: (projectId: string, unitId?: string) => void;
  onOpenMilestonesConfig: (projectId: string) => void;
  onToggleManualMilestone: (projectId: string, milestoneId: string) => void;
  onUpdateProjectDates?: (projectId: string, startDate: string, estimatedEndDate: string) => void;
  onEditProject?: (project: Project) => void;
  onOpenUnitBlueprints?: (unit: Unit) => void;
}

export function UnitsView({
  project,
  presentationBg,
  onSelectUnit,
  onOpenNewUnitModal,
  onOpenReportModal,
  onEditUnit,
  onRequestDeleteUnit,
  onRequestDeleteProject,
  onExportExcel,
  onOpenMilestonesConfig,
  onToggleManualMilestone,
  onUpdateProjectDates,
  onEditProject,
  onOpenUnitBlueprints
}: UnitsViewProps) {
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'unit' | 'common_area'>('all');

  const overallProgress = calculateProjectProgress(project, tradeFilter);
  const activeTrade = MASTER_TRADES_TEMPLATE.find(t => t.id === tradeFilter);

  // Global counts by space type
  const countDeptos = project.units.filter(u => !isUnitCommonArea(u)).length;
  const countCommon = project.units.filter(u => isUnitCommonArea(u)).length;
  const countAll = project.units.length;

  // Filter units matching active type filter (solapa: 'all' | 'unit' | 'common_area')
  const unitsMatchingType = project.units.filter(unit => {
    const isCommon = isUnitCommonArea(unit);
    if (typeFilter === 'unit') return !isCommon;
    if (typeFilter === 'common_area') return isCommon;
    return true;
  });

  // Calculate status for each unit in the active type filter
  const tabUnitsWithStatus = unitsMatchingType.map(unit => {
    const progress = calculateUnitProgress(unit, tradeFilter);
    let status: StatusFilter = 'pending';
    if (progress >= 100) {
      status = 'completed';
    } else if (progress > 0) {
      status = 'in_progress';
    }
    return { unit, progress, status };
  });

  // Active tab progress (average of units in current tab)
  const tabProgress = calculateProjectProgress(project, tradeFilter, typeFilter);

  // Dynamic counts for status chips based on selected space tab (Deptos vs Comunes vs Todos)
  const tabTotalCount = tabUnitsWithStatus.length;
  const tabCompletedCount = tabUnitsWithStatus.filter(u => u.status === 'completed').length;
  const tabInProgressCount = tabUnitsWithStatus.filter(u => u.status === 'in_progress').length;
  const tabPendingCount = tabUnitsWithStatus.filter(u => u.status === 'pending').length;

  // Final filtered units applying the status filter chip ('all' | 'completed' | 'in_progress' | 'pending')
  const filteredUnits = tabUnitsWithStatus.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  const getTradeIcon = (id: string) => {
    switch (id) {
      case 'albanileria': return <BrickWall className="w-3.5 h-3.5" />;
      case 'plomeria': return <Pipette className="w-3.5 h-3.5" />;
      case 'electricidad': return <Zap className="w-3.5 h-3.5" />;
      case 'carpinteria_madera': return <DoorOpen className="w-3.5 h-3.5" />;
      case 'carpinteria_aluminio': return <Maximize2 className="w-3.5 h-3.5" />;
      default: return <Wrench className="w-3.5 h-3.5" />;
    }
  };

  return (
    <section className="space-y-4">
      {/* Project Summary Card */}
      <div
        className={`rounded-2xl p-4 shadow-sm border transition-colors ${
          presentationBg
            ? 'text-white border-slate-700/60 shadow-lg'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
        style={presentationBg ? (presentationBg.startsWith('linear') ? { background: presentationBg } : { backgroundColor: presentationBg }) : undefined}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${presentationBg ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
              Obra Activa
            </span>
            <h2 className={`text-lg font-black leading-tight ${presentationBg ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              {project.name}
            </h2>
            <p className={`text-xs ${presentationBg ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
              {project.location} • {project.units.length} Espacios ({countDeptos} deptos, {countCommon} comunes)
              {typeFilter !== 'all' && (
                <span className={`font-bold block sm:inline sm:ml-1 ${presentationBg ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'}`}>
                  • Viendo {typeFilter === 'unit' ? `${countDeptos} Deptos` : `${countCommon} Espacios Comunes`}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-center flex-shrink-0">
            <AnimatedCircularProgress
              percentage={typeFilter === 'all' ? overallProgress : tabProgress}
              size={56}
              strokeWidth={4.5}
              color="#10B981"
            />
            <p className={`text-[9px] uppercase font-bold mt-0.5 text-center ${presentationBg ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
              {typeFilter === 'all'
                ? (tradeFilter === 'all' ? 'Avance General' : activeTrade?.shortName)
                : typeFilter === 'unit'
                ? (tradeFilter === 'all' ? 'Avance Deptos' : `${activeTrade?.shortName} Deptos`)
                : (tradeFilter === 'all' ? 'Avance Comunes' : `${activeTrade?.shortName} Comunes`)}
            </p>
          </div>
        </div>

        {/* Ficha Técnica y Administrativa Collapsible/Card */}
        <div className={`mt-3 p-2.5 rounded-xl border text-xs space-y-1 ${
          presentationBg
            ? 'bg-black/30 border-white/10 text-slate-200'
            : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className={`flex items-center justify-between text-[11px] font-bold ${presentationBg ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>
            <span className={`flex items-center gap-1 ${presentationBg ? 'text-amber-300' : 'text-amber-700 dark:text-amber-400'}`}>
              <FileCheck className="w-3.5 h-3.5 text-amber-500" />
              Ficha Técnica y Administrativa de la Obra
            </span>
            {onEditProject && (
              <button
                type="button"
                onClick={() => onEditProject(project)}
                className="text-[10px] font-black text-amber-500 hover:underline flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-500/10"
              >
                <Pencil className="w-2.5 h-2.5" /> Editar Datos
              </button>
            )}
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] pt-0.5 ${presentationBg ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
            <div>
              <strong className={presentationBg ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'}>Exp. Municipal:</strong>{' '}
              {project.expedienteMunicipal || <span className="text-slate-400 italic">Sin cargar</span>}
            </div>
            <div>
              <strong className={presentationBg ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'}>EDEMSA:</strong>{' '}
              {project.expedienteEdemsa || <span className="text-slate-400 italic">Sin cargar</span>}
            </div>
            <div>
              <strong className={presentationBg ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'}>AYSAM:</strong>{' '}
              {project.expedienteAysam || <span className="text-slate-400 italic">Sin cargar</span>}
            </div>
            {project.customServices && project.customServices.map(srv => (
              <div key={srv.id}>
                <strong className={presentationBg ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'}>{srv.name.split('(')[0].trim()}:</strong>{' '}
                {srv.number}
              </div>
            ))}
            {project.technicalNotes && (
              <div className={`sm:col-span-3 text-[11px] italic pt-0.5 ${presentationBg ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
                Memoria: &ldquo;{project.technicalNotes}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Action buttons inside project summary */}
        <div className={`flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t ${
          presentationBg ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'
        }`}>
          <button
            onClick={() => onOpenReportModal('project', project.id)}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors shadow-2xs"
            title="Acta Técnica PDF de toda la obra"
          >
            <FileText className="w-3 h-3 text-rose-600" />
            <span>Reporte PDF</span>
          </button>

          {onExportExcel && (
            <button
              onClick={() => onExportExcel(project.id)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors shadow-2xs"
              title="Descargar planilla completa en Excel para tildar a mano en terreno"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Planilla Excel (Para tildar a mano)</span>
            </button>
          )}

          {onRequestDeleteProject && (
            <button
              onClick={() => onRequestDeleteProject(project.id, project.name)}
              className="ml-auto px-2 py-1 bg-rose-50/70 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
              title="Eliminar esta obra (requiere clave 2600)"
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
              <span>Eliminar Obra</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-200 dark:border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${typeFilter === 'all' ? overallProgress : tabProgress}%` }}
          />
        </div>

        {/* Línea de Tiempo e Hitos Críticos de la Obra */}
        <div className="mt-3.5">
          <ProjectTimeline
            project={project}
            compact={false}
            onOpenMilestonesConfig={onOpenMilestonesConfig}
            onToggleManualMilestone={onToggleManualMilestone}
            onSelectUnit={onSelectUnit}
            onUpdateProjectDates={onUpdateProjectDates}
          />
        </div>
      </div>

      {/* Specialty / Trade Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5 transition-colors">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Filtrar por Gremio:
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
            {tradeFilter === 'all' ? 'Todos los gremios' : activeTrade?.name}
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 text-xs">
          <button
            onClick={() => setTradeFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
              tradeFilter === 'all'
                ? 'bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-amber-500 shadow-sm ring-1 ring-amber-500'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <span>Todos</span>
          </button>

          {MASTER_TRADES_TEMPLATE.map(trade => {
            const isActive = tradeFilter === trade.id;
            return (
              <button
                key={trade.id}
                onClick={() => setTradeFilter(trade.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
                  isActive
                    ? 'bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-amber-500 shadow-sm ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                {getTradeIcon(trade.id)}
                <span>{trade.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subheader and Add Unit button */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            {typeFilter === 'unit' ? (
              <>
                <DoorOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Departamentos ({countDeptos})</span>
              </>
            ) : typeFilter === 'common_area' ? (
              <>
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Espacios Comunes y de Servicio ({countCommon})</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Unidades y Espacios Comunes ({countAll})</span>
              </>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tradeFilter === 'all'
              ? `Toca para abrir checklist técnico (${tabTotalCount} ${typeFilter === 'unit' ? 'deptos' : typeFilter === 'common_area' ? 'comunes' : 'espacios'})`
              : `Mostrando avance de ${activeTrade?.name} en ${tabTotalCount} espacios`}
          </p>
        </div>

        <button
          onClick={onOpenNewUnitModal}
          className="bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 active:scale-95 text-amber-400 dark:text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center shadow border border-amber-500/40 touch-target transition-all"
        >
          <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> + Agregar Espacio
        </button>
      </div>

      {/* Space Category Filter Tabs (Todos / Deptos / Espacios Comunes) */}
      <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs transition-colors">
        <button
          onClick={() => setTypeFilter('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
            typeFilter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Todos ({countAll})
        </button>
        <button
          onClick={() => setTypeFilter('unit')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
            typeFilter === 'unit'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Deptos ({countDeptos})</span>
        </button>
        <button
          onClick={() => setTypeFilter('common_area')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
            typeFilter === 'common_area'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Comunes ({countCommon})</span>
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 shadow-sm touch-target ${
            statusFilter === 'all'
              ? 'bg-amber-500 text-slate-950 border-amber-500'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <span>Todos</span>
          <span className="bg-slate-950/15 dark:bg-slate-100/15 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {tabTotalCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-medium transition-all border text-xs flex items-center gap-1.5 touch-target ${
            statusFilter === 'completed'
              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <CircleCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Completado</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-black text-slate-700 dark:text-slate-300">
            {tabCompletedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-medium transition-all border text-xs flex items-center gap-1.5 touch-target ${
            statusFilter === 'in_progress'
              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>En curso</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-black text-slate-700 dark:text-slate-300">
            {tabInProgressCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-medium transition-all border text-xs flex items-center gap-1.5 touch-target ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <Circle className="w-3.5 h-3.5 text-slate-400" />
          <span>Pendiente</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-black text-slate-700 dark:text-slate-300">
            {tabPendingCount}
          </span>
        </button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredUnits.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Sin unidades con este filtro</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Prueba cambiando el filtro de estado o tipo arriba.</p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="mt-3 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
            >
              Ver Todas las Unidades
            </button>
          </div>
        ) : (
          filteredUnits.map(({ unit, progress }) => {
            const counts = getUnitItemCounts(unit, tradeFilter);
            const isComplete = progress === 100;
            const isCommonArea = isUnitCommonArea(unit);

            let badgeBg = 'bg-slate-900 text-amber-400';
            if (isComplete) {
              badgeBg = 'bg-emerald-600 text-white';
            } else if (progress > 0) {
              badgeBg = 'bg-amber-600 text-white';
            }

            return (
              <div
                key={unit.id}
                onClick={() => onSelectUnit(unit.id)}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-3.5 shadow-sm border ${
                  isComplete
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/15 dark:bg-emerald-950/20'
                    : isCommonArea
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/5 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                } hover:border-amber-400 dark:hover:border-amber-500 active:scale-95 transition-all cursor-pointer flex flex-col justify-between touch-target group`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`w-7 h-7 rounded-lg ${badgeBg} flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0`}>
                      {isComplete ? (
                        <CircleCheck className="w-4 h-4" />
                      ) : isCommonArea ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <DoorOpen className="w-4 h-4" />
                      )}
                    </span>

                    {/* Animated Circular Progress on Unit Card */}
                    <AnimatedCircularProgress
                      percentage={progress}
                      size={44}
                      strokeWidth={4}
                      color="#10B981"
                    />
                  </div>

                  {/* Type & Status Badges */}
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isCommonArea
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {isCommonArea ? 'Común' : 'Depto'}
                    </span>
                    {unit.floorLabel && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 truncate max-w-[85px]">
                        {unit.floorLabel}
                      </span>
                    )}
                    {unit.signature && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        ✔
                      </span>
                    )}
                    {unit.isLocked && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                        🔒
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate pr-1">
                      {unit.name}
                    </h4>

                    {/* Edit & Delete Action icons */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditUnit(unit);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 active:scale-95 transition-all"
                        title="Editar denominación"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {onRequestDeleteUnit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDeleteUnit(unit.id, unit.name);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition-all"
                          title="Eliminar este espacio (Clave 2600)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {counts.completed}/{counts.total} {tradeFilter === 'all' ? 'ítems' : 'tareas'}
                  </p>
                </div>

                <div className="mt-2.5">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReportModal('unit', project.id, unit.id);
                        }}
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold text-[10px] flex items-center gap-0.5 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800"
                        title="Acta Técnica PDF de esta unidad"
                      >
                        <FileText className="w-2.5 h-2.5" /> PDF
                      </button>

                      {onOpenUnitBlueprints && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenUnitBlueprints(unit);
                          }}
                          className="text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold text-[10px] flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800"
                          title="Ver o adjuntar planos de esta unidad"
                        >
                          <Compass className="w-2.5 h-2.5 text-amber-500" />
                          <span>Planos ({unit.blueprints?.length || 0})</span>
                        </button>
                      )}

                      {onExportExcel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExportExcel(project.id, unit.id);
                          }}
                          className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold text-[10px] flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                          title="Descargar Planilla Excel con casillas para tildar a mano"
                        >
                          <FileSpreadsheet className="w-2.5 h-2.5" /> XLS
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ml-auto">
                      Auditar <ArrowRight className="w-3 h-3" />
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
