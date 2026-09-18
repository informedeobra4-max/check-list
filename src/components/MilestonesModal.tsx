import { useState } from 'react';
import {
  X,
  Calendar,
  Plus,
  Trash2,
  Pencil,
  Check,
  RotateCcw,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Sliders
} from 'lucide-react';
import { Project, Milestone } from '../types';
import { MASTER_TRADES_TEMPLATE } from '../data/initialData';
import { calculateMilestoneProgress } from '../utils/milestones';

interface MilestonesModalProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
  onSaveMilestone: (projectId: string, milestone: Milestone) => void;
  onDeleteMilestone: (projectId: string, milestoneId: string) => void;
  onToggleManualMilestone: (projectId: string, milestoneId: string) => void;
}

export function MilestonesModal({
  isOpen,
  project,
  onClose,
  onSaveMilestone,
  onDeleteMilestone,
  onToggleManualMilestone
}: MilestonesModalProps) {
  const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [linkType, setLinkType] = useState<'item' | 'trade'>('item');
  const [linkedTradeId, setLinkedTradeId] = useState(MASTER_TRADES_TEMPLATE[0]?.id || 'plomeria');
  const [linkedItemName, setLinkedItemName] = useState('');
  const [minPercentageRequired, setMinPercentageRequired] = useState(100);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const milestones: Milestone[] = project.milestones || [];

  // Available trades from master template or project units
  const availableTrades = MASTER_TRADES_TEMPLATE;
  const currentTrade = availableTrades.find(t => t.id === linkedTradeId) || availableTrades[0];
  const availableItems = currentTrade?.items || [];

  const handleStartAdd = () => {
    setEditingId(null);
    setName('');
    // Default target date 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setTargetDate(d.toISOString().split('T')[0]);
    setLinkType('item');
    setLinkedTradeId(availableTrades[0]?.id || 'plomeria');
    setLinkedItemName(availableTrades[0]?.items[0] || '');
    setMinPercentageRequired(100);
    setNotes('');
    setIsAddingOrEditing(true);
  };

  const handleStartEdit = (m: Milestone) => {
    setEditingId(m.id);
    setName(m.name);
    setTargetDate(m.targetDate);
    setLinkType(m.linkType);
    setLinkedTradeId(m.linkedTradeId);
    setLinkedItemName(m.linkedItemName || (availableTrades.find(t => t.id === m.linkedTradeId)?.items[0] || ''));
    setMinPercentageRequired(m.minPercentageRequired ?? 100);
    setNotes(m.notes || '');
    setIsAddingOrEditing(true);
  };

  const handleTradeChange = (newTradeId: string) => {
    setLinkedTradeId(newTradeId);
    const trade = availableTrades.find(t => t.id === newTradeId);
    if (trade && trade.items.length > 0) {
      setLinkedItemName(trade.items[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetDate) return;

    const newMilestone: Milestone = {
      id: editingId || `ms_${Date.now()}`,
      name: name.trim(),
      targetDate,
      linkType,
      linkedTradeId,
      linkedItemName: linkType === 'item' ? linkedItemName : undefined,
      minPercentageRequired: Math.min(100, Math.max(1, minPercentageRequired)),
      notes: notes.trim() || undefined
    };

    onSaveMilestone(project.id, newMilestone);
    setIsAddingOrEditing(false);
    setEditingId(null);
  };

  const handleQuickPreset = (presetName: string, tradeId: string, itemName: string, daysAhead: number, minReq = 100) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const targetDateStr = d.toISOString().split('T')[0];

    const presetMilestone: Milestone = {
      id: `ms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: presetName,
      targetDate: targetDateStr,
      linkType: 'item',
      linkedTradeId: tradeId,
      linkedItemName: itemName,
      minPercentageRequired: minReq
    };

    onSaveMilestone(project.id, presetMilestone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                Gestión de Hitos Críticos
              </h3>
              <p className="text-xs text-slate-300">
                {project.name} • Cronograma y Alarmas Rojas de Obra
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Form to Add or Edit */}
          {isAddingOrEditing ? (
            <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {editingId ? 'Editar Hito Crítico' : 'Nuevo Hito Crítico'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingOrEditing(false)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
                >
                  Cancelar
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre descriptivo del Hito *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Finalización de Instalación Sanitaria"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Target Date & Minimum Percentage in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite Estimada *
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    % Mínimo Requerido a la fecha *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={minPercentageRequired}
                      onChange={(e) => setMinPercentageRequired(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    (100% para finalización total, o 50% para mitad de etapa)
                  </span>
                </div>
              </div>

              {/* Linkage selector */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  Vinculación con el Checklist de Obra:
                </label>

                <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="linkType"
                      checked={linkType === 'item'}
                      onChange={() => setLinkType('item')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Ítem específico del checklist</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="linkType"
                      checked={linkType === 'trade'}
                      onChange={() => setLinkType('trade')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Gremio completo</span>
                  </label>
                </div>

                {/* Trade Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Gremio:
                  </label>
                  <select
                    value={linkedTradeId}
                    onChange={(e) => handleTradeChange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {availableTrades.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Selector if linkType === 'item' */}
                {linkType === 'item' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Ítem Técnico vinculado:
                    </label>
                    <select
                      value={linkedItemName}
                      onChange={(e) => setLinkedItemName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {availableItems.map((it, idx) => (
                        <option key={idx} value={it}>
                          {it}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      El sistema sumará y promediará el avance de esta tarea a través de todos los departamentos del complejo.
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Observaciones del Hito (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Prueba hidráulica previa al cierre de muros"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingOrEditing(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Guardar Cambios' : 'Crear Hito'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Hitos Críticos Registrados ({milestones.length})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supervisión del cronograma con cálculo automático desde los departamentos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Hito</span>
              </button>
            </div>
          )}

          {/* List of Existing Milestones */}
          {milestones.length === 0 && !isAddingOrEditing ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No hay hitos críticos definidos
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Puedes crear un hito personalizado o agregar uno de los hitos rápidos recomendados:
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('Finalización de Instalación Sanitaria', 'plomeria', 'Cañerías de distribución de agua', 15, 100)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:border-amber-400 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  + Inst. Sanitaria (15 días)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('Muros y Tabiques Interiores', 'albanileria', 'Muros y tabiques', 25, 80)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:border-amber-400 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  + Tabiquería 80% (25 días)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('Canalizaciones Eléctricas', 'electricidad', 'Canalizaciones y corrugados', 30, 100)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:border-amber-400 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  + Canalización Eléctrica (30 días)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {milestones.map(m => {
                const calc = calculateMilestoneProgress(m, project);
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      calc.status === 'alarm_red'
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 shadow-xs'
                        : calc.status === 'warning_yellow'
                        ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-xs'
                        : calc.status === 'success_green'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              calc.status === 'alarm_red'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : calc.status === 'warning_yellow'
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : calc.status === 'success_green'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {calc.status === 'alarm_red' && <Flame className="w-3 h-3" />}
                            {calc.status === 'warning_yellow' && <AlertTriangle className="w-3 h-3" />}
                            {calc.status === 'success_green' && <CheckCircle2 className="w-3 h-3" />}
                            {calc.statusLabel}
                          </span>

                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            • Fecha límite: {calc.targetDateFormatted}
                          </span>

                          {calc.isOverdue && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black">
                              (Vencido)
                            </span>
                          )}
                        </div>

                        <h5 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                          {m.name}
                        </h5>

                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          <span>
                            {m.linkType === 'item' ? (
                              <>
                                Ítem: <strong className="text-slate-800 dark:text-slate-200">{m.linkedItemName}</strong>
                              </>
                            ) : (
                              <>
                                Gremio: <strong className="text-slate-800 dark:text-slate-200">{m.linkedTradeId}</strong>
                              </>
                            )}
                          </span>
                        </p>

                        {/* Progress Bar & Stats */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">
                              Avance en el complejo:
                            </span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">
                              {calc.consolidatedProgress}% / Meta: {calc.minRequired}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                calc.status === 'alarm_red'
                                  ? 'bg-rose-500'
                                  : calc.status === 'warning_yellow'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${calc.consolidatedProgress}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                            <span>
                              {calc.completedUnits} de {calc.totalUnits} unidades al 100%
                            </span>
                            <span>
                              {calc.inProgressUnits > 0 && `${calc.inProgressUnits} en curso • `}
                              {calc.pendingUnits} pendientes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on the milestone */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleManualMilestone(project.id, m.id)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                            m.manualCompleted
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800'
                          }`}
                          title="Forzar cumplimiento manual"
                        >
                          {m.manualCompleted ? (
                            <>
                              <RotateCcw className="w-3 h-3" /> Auto
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" /> Forzar OK
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(m)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Editar este hito"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMilestone(project.id, m.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Eliminar este hito"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Los cambios se sincronizan en tiempo real con la línea de tiempo.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
