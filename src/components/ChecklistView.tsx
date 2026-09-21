import React, { useState, useMemo } from 'react';
import {
  FileText,
  Check,
  Camera,
  Trash2,
  Plus,
  ChevronDown,
  Layers,
  Clock,
  CircleCheck,
  BrickWall,
  Pipette,
  Zap,
  DoorOpen,
  Maximize2,
  Wrench,
  ChevronsDown,
  ChevronsUp,
  Pencil,
  MessageSquare,
  MessageSquareText,
  FileSpreadsheet,
  Building2,
  Flame,
  AlertTriangle,
  PenTool,
  Lock,
  Unlock,
  FileCheck2,
  Compass
} from 'lucide-react';
import { Project, Unit, TaskFilter, InspectionItem, Trade } from '../types';
import { calculateUnitProgress, getUnitItemCounts, isUnitCommonArea, isTradeMatchingFilter } from '../utils/calculations';
import { MASTER_TRADES_TEMPLATE } from '../data/initialData';
import { ItemObservationModal } from './ItemObservationModal';
import { AddItemScopeModal } from './AddItemScopeModal';
import { AnimatedCircularProgress } from './AnimatedCircularProgress';

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

interface ChecklistViewProps {
  project: Project;
  unit: Unit;
  allProjects?: Project[];
  onToggleItem: (tradeId: string, itemId: string) => void;
  onUpdateItemProgress: (tradeId: string, itemId: string, percentage: number) => void;
  onDeleteItem: (tradeId: string, itemId: string) => void;
  onAddItem: (tradeId: string, itemName: string, scope?: 'current_unit' | 'selected_projects', targetProjectIds?: string[]) => void;
  onSaveComment: (tradeId: string, itemId: string, comment: string) => void;
  onOpenPhotoViewer: (tradeId: string, itemId: string, tradeName: string, itemName: string) => void;
  onTriggerQuickPhoto: (tradeId: string, itemId: string, tradeName: string, itemName: string) => void;
  onOpenReportModal: (type?: 'auto' | 'project' | 'unit', projectId?: string, unitId?: string) => void;
  onEditUnit: (unit: Unit) => void;
  onRequestDeleteUnit?: (unitId: string, unitName: string) => void;
  onExportExcel?: (projectId: string, unitId?: string) => void;
  onOpenSignatureModal?: (unitId: string) => void;
  onSaveObservation?: (tradeId: string, itemId: string, comment: string, severity: 'low' | 'medium' | 'high' | undefined, isExplicitDelete?: boolean) => void;
  onAddPhoto?: (tradeId: string, itemId: string, dataUrl: string) => void;
  onDeletePhoto?: (tradeId: string, itemId: string, photoId: string) => void;
  onUnlockUnit?: (unitId: string) => void;
  onOpenBlueprints?: () => void;
  onAddTrade?: (tradeName: string, scope?: 'current_unit' | 'all_units') => void;
  onDeleteTrade?: (tradeId: string, tradeName: string, scope?: 'current_unit' | 'all_units') => void;
}

export function ChecklistView({
  project,
  unit,
  allProjects,
  onToggleItem,
  onUpdateItemProgress,
  onDeleteItem,
  onAddItem,
  onSaveComment,
  onOpenPhotoViewer,
  onTriggerQuickPhoto,
  onOpenReportModal,
  onEditUnit,
  onRequestDeleteUnit,
  onExportExcel,
  onOpenSignatureModal,
  onSaveObservation,
  onAddPhoto,
  onDeletePhoto,
  onUnlockUnit,
  onOpenBlueprints,
  onAddTrade,
  onDeleteTrade
}: ChecklistViewProps) {
  const [selectedTradeFilter, setSelectedTradeFilter] = useState<string>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskFilter>('all');
  const [tradeSectionTab, setTradeSectionTab] = useState<'filter' | 'manage'>('filter');
  const [newTradeNameDraft, setNewTradeNameDraft] = useState<string>('');
  const [newTradeScope, setNewTradeScope] = useState<'current_unit' | 'all_units'>('current_unit');
  const [collapsedTrades, setCollapsedTrades] = useState<Record<string, boolean>>({});
  const [newTaskNames, setNewTaskNames] = useState<Record<string, string>>({});
  const [editingCommentItemId, setEditingCommentItemId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<string>('');
  const [observationModalItem, setObservationModalItem] = useState<{
    tradeId: string;
    tradeName: string;
    item: InspectionItem;
  } | null>(null);
  const [pendingItemToAdd, setPendingItemToAdd] = useState<{
    tradeId: string;
    tradeName: string;
    itemName: string;
  } | null>(null);

  const unitTradesList = useMemo(() => {
    const map = new Map<string, Trade>();
    unit.trades.forEach(t => {
      const key = t.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { ...t, items: [...(t.items || [])] });
      } else {
        const existing = map.get(key)!;
        const existingItemIds = new Set(existing.items.map(i => i.id));
        (t.items || []).forEach(item => {
          if (!existingItemIds.has(item.id)) {
            existing.items.push(item);
            existingItemIds.add(item.id);
          }
        });
      }
    });
    return Array.from(map.values());
  }, [unit.trades]);

  const unitPct = calculateUnitProgress(unit, selectedTradeFilter);
  const globalUnitPct = calculateUnitProgress(unit, 'all');
  const counts = getUnitItemCounts(unit, selectedTradeFilter);
  const activeTradeObj = unitTradesList.find(t => isTradeMatchingFilter(t, selectedTradeFilter)) || MASTER_TRADES_TEMPLATE.find(t => isTradeMatchingFilter(t, selectedTradeFilter));

  const toggleTrade = (tradeId: string) => {
    setCollapsedTrades(prev => ({ ...prev, [tradeId]: !prev[tradeId] }));
  };

  const toggleAll = (expand: boolean) => {
    const nextState: Record<string, boolean> = {};
    unitTradesList.forEach(t => {
      nextState[t.id] = !expand;
    });
    setCollapsedTrades(nextState);
  };

  const handleAddTaskSubmit = (e: React.FormEvent, tradeId: string, tradeName: string) => {
    e.preventDefault();
    const name = newTaskNames[tradeId]?.trim();
    if (!name) return;
    setPendingItemToAdd({ tradeId, tradeName, itemName: name });
  };

  const handleConfirmAddItem = (scope: 'current_unit' | 'selected_projects', targetProjectIds: string[]) => {
    if (!pendingItemToAdd) return;
    onAddItem(pendingItemToAdd.tradeId, pendingItemToAdd.itemName, scope, targetProjectIds);
    setNewTaskNames(prev => ({ ...prev, [pendingItemToAdd.tradeId]: '' }));
    setPendingItemToAdd(null);
  };

  const handleShareWhatsAppTrade = (e: React.MouseEvent, trade: Trade, tradePct: number) => {
    e.stopPropagation();

    const pendingTasks = trade.items.filter(item => {
      const p = item.progressPercentage !== undefined ? item.progressPercentage : (item.completed ? 100 : 0);
      return !item.completed && p < 100;
    });

    let mensaje = `*CONTROL DE AVANCE*\n`;
    mensaje += `*Obra:* ${project.name}\n`;
    mensaje += `*Departamento:* ${unit.name}\n`;
    mensaje += `*Gremio:* ${trade.name}\n`;
    mensaje += `*Estado:* ${tradePct}% de avance\n\n`;

    if (tradePct >= 100 || pendingTasks.length === 0) {
      mensaje += `Todas las tareas completadas y verificadas al 100%`;
    } else {
      mensaje += `*Tareas Pendientes:*\n`;
      pendingTasks.forEach(item => {
        const comment = item.comment && item.comment.trim() ? ` (${item.comment.trim().replace(/\r?\n/g, ' ')})` : '';
        mensaje += `• ${item.name}${comment}\n`;
      });
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

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
      {/* Unit Status Banner */}
      <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-lg border-l-4 border-amber-500 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black rounded uppercase">
              {isUnitCommonArea(unit) ? 'Espacio Común' : 'Departamento'}
            </span>
            <span className="text-xs text-slate-300 font-bold truncate">
              {project.name}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-xl font-black text-white leading-tight">
              {unit.name}
            </h2>
            <button
              onClick={() => onEditUnit(unit)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/50 transition-colors"
              title="Editar denominación"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {onRequestDeleteUnit && (
              <button
                onClick={() => onRequestDeleteUnit(unit.id, unit.name)}
                className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 hover:border-rose-500 transition-colors"
                title="Eliminar este espacio/depto (Requiere clave 2600)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-300 mt-0.5">
            {counts.completed} de {counts.total} ítems validados ({unitPct}%)
            {selectedTradeFilter !== 'all' && ` • Global: ${globalUnitPct}%`}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <button
              onClick={() => onOpenReportModal('unit', project.id, unit.id)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow touch-target transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-rose-700" />
              <span>Reporte PDF</span>
            </button>

            {onExportExcel && (
              <button
                onClick={() => onExportExcel(project.id, unit.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow touch-target transition-all active:scale-95 border border-emerald-400/40"
                title="Descargar planilla en Excel con casillas para tildar a mano"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Planilla Excel (Para tildar)</span>
              </button>
            )}

            {onOpenSignatureModal && (
              <button
                onClick={() => onOpenSignatureModal(unit.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow touch-target transition-all active:scale-95 border ${
                  unit.signature
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40'
                }`}
                title={unit.signature ? `Firmado por ${unit.signedBy || 'Responsable'}` : 'Firmar acta digitalmente'}
              >
                {unit.signature ? <FileCheck2 className="w-3.5 h-3.5 text-white" /> : <PenTool className="w-3.5 h-3.5 text-amber-400" />}
                <span>{unit.signature ? 'Acta Firmada ✔' : 'Firmar Acta'}</span>
              </button>
            )}

            {onOpenBlueprints && (
              <button
                onClick={onOpenBlueprints}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-black flex items-center gap-1.5 shadow touch-target transition-all active:scale-95 border border-amber-500/40"
                title="Abrir y verificar planos técnicos de esta unidad"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Planos ({unit.blueprints?.length || 0})</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center flex-shrink-0">
          <AnimatedCircularProgress
            percentage={unitPct}
            size={58}
            strokeWidth={4.5}
            color="#10B981"
          />
        </div>
      </div>

      {/* Lock Notice Banner if unit is locked */}
      {unit.isLocked && (
        <div className="bg-rose-50 border-2 border-rose-300 p-3 rounded-2xl flex items-center justify-between text-xs text-rose-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-black text-rose-950 text-xs leading-tight">
                Inspección Bloqueada por Acta de Recepción
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Firmada por <span className="font-bold text-rose-900">{unit.signedBy || 'Supervisor'}</span> ({unit.signedAt || 'Registrada'}). Las tareas están protegidas contra cambios.
              </p>
            </div>
          </div>
          {onUnlockUnit && (
            <button
              onClick={() => onUnlockUnit(unit.id)}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors flex-shrink-0 ml-2"
              title="Desbloquear para permitir ajustes en los ítems"
            >
              <Unlock className="w-3.5 h-3.5 text-rose-600" />
              <span>Desbloquear</span>
            </button>
          )}
        </div>
      )}

      {/* Trade Filter & Management Section */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setTradeSectionTab('filter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all touch-target ${
                tradeSectionTab === 'filter'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Filtrar Gremios</span>
            </button>

            <button
              type="button"
              onClick={() => setTradeSectionTab('manage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all touch-target ${
                tradeSectionTab === 'manage'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
              <span>Agregar o Eliminar Gremios</span>
            </button>
          </div>

          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hidden sm:inline">
            {tradeSectionTab === 'filter'
              ? (selectedTradeFilter === 'all' ? 'Todos los gremios' : activeTradeObj?.name)
              : `${unitTradesList.length} Gremios en esta unidad`}
          </span>
        </div>

        {/* TAB 1: FILTRAR GREMIOS */}
        {tradeSectionTab === 'filter' && (
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 text-xs">
              <button
                onClick={() => setSelectedTradeFilter('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
                  selectedTradeFilter === 'all'
                    ? 'bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-amber-500 shadow-sm ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <span>Todos</span>
              </button>

              {unitTradesList.map(trade => {
                const isActive = isTradeMatchingFilter(trade, selectedTradeFilter) && selectedTradeFilter !== 'all';
                return (
                  <button
                    key={trade.id}
                    onClick={() => setSelectedTradeFilter(isActive ? 'all' : trade.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border text-xs flex items-center gap-1.5 touch-target ${
                      isActive
                        ? 'bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-amber-500 shadow-sm ring-1 ring-amber-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    {getTradeIcon(trade.id)}
                    <span>{trade.shortName || trade.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: AGREGAR O ELIMINAR GREMIOS */}
        {tradeSectionTab === 'manage' && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            {/* Form to Add New Trade */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                Agregar Nuevo Gremio a la Inspección
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newTradeNameDraft}
                  onChange={(e) => setNewTradeNameDraft(e.target.value)}
                  placeholder="Ej: Pintura, Instalación de Gas, Herrería..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <select
                  value={newTradeScope}
                  onChange={(e) => setNewTradeScope(e.target.value as 'current_unit' | 'all_units')}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="current_unit">Solo en este depto ({unit.name})</option>
                  <option value="all_units">En todo el complejo ({project.name})</option>
                </select>

                <button
                  type="button"
                  disabled={!newTradeNameDraft.trim()}
                  onClick={() => {
                    if (onAddTrade && newTradeNameDraft.trim()) {
                      onAddTrade(newTradeNameDraft.trim(), newTradeScope);
                      setNewTradeNameDraft('');
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-target"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Agregar Gremio</span>
                </button>
              </div>

              {/* Quick Preset Badges */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Sugerencias rápidas de gremios:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Pintura',
                    'Instalación de Gas',
                    'Herrería',
                    'Yesería y Durlock',
                    'Vidrios',
                    'Climatización / AA',
                    'Limpieza de Obra'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewTradeNameDraft(preset)}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors active:scale-95"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List of Current Trades for Deletion / Management */}
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-2">
                Gremios Actuales ({unitTradesList.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unitTradesList.map(trade => (
                  <div
                    key={trade.id}
                    className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                        {getTradeIcon(trade.id)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {trade.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {trade.items.length} {trade.items.length === 1 ? 'tarea' : 'tareas'}
                        </p>
                      </div>
                    </div>

                    {onDeleteTrade && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteTrade(trade.id, trade.name, newTradeScope);
                          if (selectedTradeFilter === trade.id) {
                            setSelectedTradeFilter('all');
                          }
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-900/50 flex items-center gap-1 transition-colors active:scale-95 touch-target flex-shrink-0"
                        title={`Eliminar gremio ${trade.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Status Filters */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 transition-colors">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Estado de Tareas:
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {taskStatusFilter === 'all' ? 'Todas las tareas' : (taskStatusFilter === 'pending' ? 'Solo pendientes' : 'Solo completadas')}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <button
            onClick={() => setTaskStatusFilter('all')}
            className={`py-1.5 px-2 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 touch-target ${
              taskStatusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Todas</span>
            <span className="bg-slate-950/15 dark:bg-slate-100/15 text-[10px] px-1.5 rounded-full font-black">
              {counts.total}
            </span>
          </button>

          <button
            onClick={() => setTaskStatusFilter('pending')}
            className={`py-1.5 px-2 rounded-xl font-medium border transition-all flex items-center justify-center gap-1.5 touch-target ${
              taskStatusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Pendientes</span>
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] px-1.5 rounded-full font-black">
              {counts.total - counts.completed}
            </span>
          </button>

          <button
            onClick={() => setTaskStatusFilter('completed')}
            className={`py-1.5 px-2 rounded-xl font-medium border transition-all flex items-center justify-center gap-1.5 touch-target ${
              taskStatusFilter === 'completed'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <CircleCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Listas</span>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] px-1.5 rounded-full font-black">
              {counts.completed}
            </span>
          </button>
        </div>
      </div>

      {/* Expand / Collapse Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => toggleAll(true)}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 touch-target flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
        >
          <ChevronsDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Expandir Todo
        </button>
        <button
          onClick={() => toggleAll(false)}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 touch-target flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
        >
          <ChevronsUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Colapsar
        </button>
      </div>

      {/* Trades Accordion */}
      <div className="space-y-3">
        {unitTradesList.map(trade => {
          if (!isTradeMatchingFilter(trade, selectedTradeFilter)) {
            return null;
          }

          const filteredItems = trade.items.filter(item => {
            const currentPct = item.progressPercentage !== undefined ? item.progressPercentage : (item.completed ? 100 : 0);
            const isComplete = item.completed || currentPct === 100;
            if (taskStatusFilter === 'completed') return isComplete;
            if (taskStatusFilter === 'pending') return !isComplete;
            return true;
          });

          const totalTradeItems = trade.items.length;
          const completedTradeItems = trade.items.filter(i => i.completed || (i.progressPercentage === 100)).length;
          const totalTradeProgress = trade.items.reduce((sum, it) => {
            const p = it.progressPercentage !== undefined ? it.progressPercentage : (it.completed ? 100 : 0);
            return sum + p;
          }, 0);
          const tradePct = totalTradeItems === 0 ? 0 : Math.round(totalTradeProgress / totalTradeItems);
          const isCollapsed = collapsedTrades[trade.id] === true;

          // If filtering by status and no tasks match in this trade (when showing all trades)
          if (taskStatusFilter !== 'all' && filteredItems.length === 0 && selectedTradeFilter === 'all') {
            return null;
          }

          return (
            <div
              key={trade.id}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleTrade(trade.id)}
                className="px-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer active:bg-slate-100 dark:active:bg-slate-800 touch-target select-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-amber-700 dark:text-amber-400 text-sm flex-shrink-0">
                    {getTradeIcon(trade.id)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {trade.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {completedTradeItems}/{totalTradeItems} verificados •{' '}
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{tradePct}%</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Botón táctil WhatsApp (color verde esmeralda) */}
                  <button
                    type="button"
                    onClick={(e) => handleShareWhatsAppTrade(e, trade, tradePct)}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white shadow-xs transition-all flex items-center gap-1.5 touch-target cursor-pointer border border-emerald-500/60"
                    title={`Enviar tareas pendientes de ${trade.name} por WhatsApp`}
                    aria-label={`Enviar tareas pendientes de ${trade.name} por WhatsApp`}
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-white flex-shrink-0" />
                    <span className="text-[11px] font-bold hidden sm:inline">WhatsApp</span>
                  </button>

                  <div className="w-14 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${tradePct}%` }}
                    />
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Accordion Content */}
              {!isCollapsed && (
                <div className="p-3 space-y-2 bg-white dark:bg-slate-900 transition-colors">
                  {filteredItems.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 text-center">
                      No hay tareas con este criterio en {trade.name}
                    </p>
                  ) : (
                    filteredItems.map(item => {
                      const photoList = item.photos || [];
                      const photoCount = photoList.length;
                      const currentPct = item.progressPercentage !== undefined ? item.progressPercentage : (item.completed ? 100 : 0);
                      const isComplete = item.completed || currentPct === 100;
                      const isPartial = !isComplete && currentPct > 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isComplete
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                              : isPartial
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-2xs'
                              : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                          }`}
                        >
                          {/* Fila Horizontal Principal con Flexbox Estricto */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              width: '100%'
                            }}
                          >
                            {/* [Izquierda - Contenido principal] */}
                            <div className="flex-1 min-w-0 pr-1 text-left">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  style={{ whiteSpace: 'normal', wordBreak: 'normal' }}
                                  className={`text-xs sm:text-sm font-bold leading-snug text-left ${
                                    isComplete
                                      ? 'text-emerald-800 dark:text-emerald-300'
                                      : isPartial
                                      ? 'text-slate-900 dark:text-slate-100'
                                      : 'text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {item.name}
                                </span>

                                {/* Severity Badges */}
                                {item.severity === 'high' && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
                                    <Flame className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                                    Crítico
                                  </span>
                                )}
                                {item.severity === 'medium' && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                    Medio
                                  </span>
                                )}
                                {item.severity === 'low' && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                    Leve
                                  </span>
                                )}
                              </div>

                              {/* Si tiene notas u observaciones, mostrar debajo del nombre en texto más pequeño (color gris suave) */}
                              {item.comment && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setObservationModalItem({ tradeId: trade.id, tradeName: trade.name, item });
                                  }}
                                  style={{ whiteSpace: 'normal', wordBreak: 'normal' }}
                                  className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer group/note"
                                  title="Tocar para editar nota, severidad o fotos"
                                >
                                  <MessageSquareText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-slate-500 dark:text-slate-400 group-hover/note:text-slate-700 dark:group-hover/note:text-slate-200 leading-tight">
                                    {item.comment}
                                  </span>
                                </div>
                              )}

                              {/* Barra de avance en curso */}
                              {isPartial && (
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <div className="w-16 sm:w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex-shrink-0">
                                    <div
                                      className="h-full bg-amber-500 rounded-full transition-all duration-200"
                                      style={{ width: `${currentPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                                    {currentPct}% en curso
                                  </span>
                                </div>
                              )}
                              {isComplete && (
                                <div className="mt-0.5">
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    ✓ 100% completado
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* [Derecha - Acciones y Controles] */}
                            <div
                              style={{ flexShrink: 0 }}
                              className="flex items-center gap-1.5 sm:gap-2"
                            >
                              {/* Botón de nota/comentario y severidad */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setObservationModalItem({ tradeId: trade.id, tradeName: trade.name, item });
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
                                  item.comment || item.severity
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900 shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
                                }`}
                                title={item.comment ? 'Ver o editar observación técnica y fotos' : 'Agregar observación o foto'}
                              >
                                <MessageSquare
                                  className={`w-3.5 h-3.5 ${
                                    item.comment || item.severity ? 'text-amber-700 dark:text-amber-400 fill-amber-500/20' : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                />
                              </button>

                              {/* Control de porcentaje: Cuadro numérico compacto (con botones - y + o input numérico) */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`flex items-center rounded-lg border h-8 px-1 transition-all shadow-2xs flex-shrink-0 ${
                                  unit.isLocked ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' :
                                  isComplete
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                                    : isPartial
                                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 ring-1 ring-amber-300/80 dark:ring-amber-500/30'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
                                }`}
                                title={unit.isLocked ? "Inspección bloqueada por acta" : "Porcentaje de avance del ítem (0% a 100%)"}
                              >
                                <button
                                  type="button"
                                  disabled={unit.isLocked}
                                  onClick={() => onUpdateItemProgress(trade.id, item.id, Math.max(0, currentPct - 10))}
                                  className={`w-4 h-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-black text-xs flex items-center justify-center select-none active:scale-90 ${unit.isLocked ? 'cursor-not-allowed' : ''}`}
                                  title="Restar 10%"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  disabled={unit.isLocked}
                                  value={currentPct}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                                    onUpdateItemProgress(trade.id, item.id, val);
                                  }}
                                  className={`w-7 text-center font-mono font-black text-xs bg-transparent focus:outline-none p-0 ${
                                    isComplete ? 'text-emerald-700 dark:text-emerald-400' : isPartial ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                                  } ${unit.isLocked ? 'cursor-not-allowed' : ''}`}
                                />
                                <span className="text-[10px] font-black text-slate-400 select-none mr-0.5">%</span>
                                <button
                                  type="button"
                                  disabled={unit.isLocked}
                                  onClick={() => onUpdateItemProgress(trade.id, item.id, Math.min(100, currentPct + 10))}
                                  className={`w-4 h-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-black text-xs flex items-center justify-center select-none active:scale-90 ${unit.isLocked ? 'cursor-not-allowed' : ''}`}
                                  title="Sumar 10%"
                                >
                                  +
                                </button>
                              </div>

                              {/* Checkbox/Tilde de completado: Casilla amplia táctil (mínimo 28x28px) */}
                              <button
                                type="button"
                                disabled={unit.isLocked}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleItem(trade.id, item.id);
                                }}
                                className={`w-8 h-8 min-w-[28px] min-h-[28px] rounded-lg border-2 flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
                                  unit.isLocked
                                    ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                                    : isComplete
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs cursor-pointer'
                                    : isPartial
                                    ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:border-amber-500 cursor-pointer'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer'
                                }`}
                                title={
                                  unit.isLocked
                                    ? 'Inspección bloqueada'
                                    : isComplete
                                    ? 'Completado (100%) - Tocar para desmarcar (0%)'
                                    : 'Marcar completado (100%)'
                                }
                              >
                                {isComplete && <Check className="w-5 h-5 stroke-[3]" />}
                              </button>

                              {/* Ícono de cámara/foto (abre modal de observación y fotos) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setObservationModalItem({ tradeId: trade.id, tradeName: trade.name, item });
                                }}
                                className={`h-8 px-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-all active:scale-95 flex-shrink-0 ${
                                  photoCount > 0
                                    ? 'bg-slate-900 text-amber-400 border border-amber-500/60 shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                                title={photoCount > 0 ? `${photoCount} foto(s) registrada(s)` : 'Tomar o adjuntar foto'}
                              >
                                <Camera className={`w-3.5 h-3.5 ${photoCount > 0 ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
                                {photoCount > 0 && (
                                  <span className="text-[11px] font-mono font-black">{photoCount}</span>
                                )}
                              </button>

                              {/* Tacho de basura para eliminar el ítem */}
                              {!unit.isLocked && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteItem(trade.id, item.id);
                                  }}
                                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center flex-shrink-0 active:scale-90 transition-colors"
                                  title="Eliminar tarea"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline Comment Editor Form */}
                          {editingCommentItemId === item.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 shadow-sm space-y-2 animate-in fade-in duration-150"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                                  {item.comment ? 'Editar Observación' : 'Nueva Observación / Comentario'}
                                </span>
                                {item.comment && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSaveComment(trade.id, item.id, '');
                                      setEditingCommentItemId(null);
                                      setCommentDraft('');
                                    }}
                                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Borrar
                                  </button>
                                )}
                              </div>

                              <textarea
                                autoFocus
                                rows={2}
                                value={commentDraft}
                                onChange={(e) => setCommentDraft(e.target.value)}
                                placeholder="Escribe detalles, tareas pendientes o notas técnicas..."
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium leading-relaxed shadow-2xs"
                              />

                              {/* Quick suggestion chips */}
                              <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mr-0.5">Sugerencias:</span>
                                {[
                                  'Falta terminación',
                                  'Pendiente de material',
                                  'Revisar nivelación / plomo',
                                  'Reparar detalle menor',
                                  'Listo para verificación'
                                ].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => {
                                      setCommentDraft(prev => prev ? `${prev}. ${preset}` : preset);
                                    }}
                                    className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 border border-amber-200 dark:border-amber-800/80 text-slate-700 dark:text-slate-300 rounded-md font-semibold transition-colors shadow-2xs"
                                  >
                                    + {preset}
                                  </button>
                                ))}
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentItemId(null);
                                    setCommentDraft('');
                                  }}
                                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg touch-target"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSaveComment(trade.id, item.id, commentDraft);
                                    setEditingCommentItemId(null);
                                    setCommentDraft('');
                                  }}
                                  className="px-3.5 py-1.5 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm flex items-center gap-1.5 touch-target active:scale-95 transition-all"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  Guardar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Photo Evidence Thumbnails Strip */}
                          {photoCount > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center gap-2 overflow-x-auto no-scrollbar">
                              {photoList.map((photo, pIdx) => (
                                <div
                                  key={photo.id}
                                  onClick={() => onOpenPhotoViewer(trade.id, item.id, trade.name, item.name)}
                                  className="relative w-11 h-11 rounded-lg overflow-hidden border border-amber-500/50 flex-shrink-0 cursor-pointer shadow-xs active:scale-95 bg-slate-900 group"
                                  title={`Ver foto ${pIdx + 1}`}
                                >
                                  <img
                                    src={photo.dataUrl}
                                    alt={`Evidencia ${pIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center font-mono py-0.2">
                                    #{pIdx + 1}
                                  </span>
                                </div>
                              ))}

                              {/* Quick button to capture or add another photo */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setObservationModalItem({ tradeId: trade.id, tradeName: trade.name, item });
                                }}
                                className="w-11 h-11 rounded-lg border border-dashed border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-500/10 flex flex-col items-center justify-center flex-shrink-0 hover:bg-amber-500/20 active:scale-95 text-[10px] font-bold"
                                title="Agregar o tomar foto"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="text-[8px] leading-none mt-0.5">Foto</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Add New Task Form in this Trade */}
                  <form
                    onSubmit={(e) => handleAddTaskSubmit(e, trade.id, trade.name)}
                    className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder={`+ Añadir tarea a ${trade.name}...`}
                      value={newTaskNames[trade.id] || ''}
                      onChange={(e) => setNewTaskNames(prev => ({ ...prev, [trade.id]: e.target.value }))}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-xs touch-target active:scale-95 flex-shrink-0 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Añadir
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Smart Scope Modal: Selector Inteligente de Obras al Agregar un Ítem */}
      {pendingItemToAdd && (
        <AddItemScopeModal
          isOpen={!!pendingItemToAdd}
          itemName={pendingItemToAdd.itemName}
          tradeId={pendingItemToAdd.tradeId}
          tradeName={pendingItemToAdd.tradeName}
          currentProject={project}
          currentUnit={unit}
          allProjects={allProjects || [project]}
          onClose={() => setPendingItemToAdd(null)}
          onConfirm={handleConfirmAddItem}
        />
      )}

      {/* Unified Technical Observation, Severity and Photo Evidence Modal */}
      {observationModalItem && (
        <ItemObservationModal
          isOpen={!!observationModalItem}
          tradeId={observationModalItem.tradeId}
          tradeName={observationModalItem.tradeName}
          item={
            unitTradesList
              .find(t => isTradeMatchingFilter(t, observationModalItem.tradeId))
              ?.items.find(i => i.id === observationModalItem.item.id) || observationModalItem.item
          }
          onClose={() => setObservationModalItem(null)}
          onSaveObservation={(tradeId, itemId, comment, severity, isExplicitDelete) => {
            if (onSaveObservation) {
              onSaveObservation(tradeId, itemId, comment, severity, isExplicitDelete);
            } else {
              onSaveComment(tradeId, itemId, comment);
            }
          }}
          onAddPhoto={(tradeId, itemId, dataUrl) => {
            if (onAddPhoto) {
              onAddPhoto(tradeId, itemId, dataUrl);
            }
          }}
          onDeletePhoto={(tradeId, itemId, photoId) => {
            if (onDeletePhoto) {
              onDeletePhoto(tradeId, itemId, photoId);
            }
          }}
        />
      )}
      {/* Floating Blueprint Quick-Access Action Button */}
      {onOpenBlueprints && (
        <div className="fixed bottom-20 right-4 sm:right-8 z-30 no-print">
          <button
            type="button"
            onClick={onOpenBlueprints}
            className="px-4 py-2.5 rounded-full bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 font-black text-xs flex items-center gap-2 shadow-2xl border-2 border-amber-500 dark:border-slate-900 active:scale-95 hover:scale-105 transition-all touch-target"
            title="Cotejar tareas contra el plano técnico"
          >
            <Compass className="w-4 h-4 text-amber-400 dark:text-slate-950" />
            <span>📐 Ver Planos ({unit.blueprints?.length || 0})</span>
          </button>
        </div>
      )}
    </section>
  );
}
