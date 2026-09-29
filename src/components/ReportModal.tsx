import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  X,
  Download,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  UserCheck,
  MessageSquare,
  Flag,
  Check
} from 'lucide-react';
import { Project, Unit } from '../types';
import { calculateUnitProgress, calculateProjectProgress, getUnitItemCounts } from '../utils/calculations';
import { formatPMDate, getTaskAlarms } from '../utils/pmCalculations';
import { MASTER_TRADES_TEMPLATE } from '../data/initialData';

interface ReportModalProps {
  isOpen: boolean;
  projects: Project[];
  defaultScope: string;
  headerLogoUrl: string;
  onClose: () => void;
  onExportJSON: () => void;
}

export function ReportModal({
  isOpen,
  projects,
  defaultScope,
  headerLogoUrl,
  onClose,
  onExportJSON
}: ReportModalProps) {
  const [selectedScope, setSelectedScope] = useState<string>(defaultScope);
  const [inspectorName, setInspectorName] = useState<string>('Arq. M. Rossi - Inspección Técnica');
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includeComments, setIncludeComments] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [includeGantt, setIncludeGantt] = useState<boolean>(true);
  const [includeUnitsProgress, setIncludeUnitsProgress] = useState<boolean>(true);

  // Synchronize scope with defaultScope on open or when defaultScope changes
  useEffect(() => {
    if (isOpen && defaultScope) {
      setSelectedScope(defaultScope);
    }
  }, [isOpen, defaultScope]);

  if (!isOpen || projects.length === 0) return null;

  // Resolve scope: "proj:<id>" or "unit:<pId>:<uId>"
  let targetProject: Project | null = null;
  let targetUnit: Unit | null = null;

  if (selectedScope.startsWith('unit:')) {
    const [, pId, uId] = selectedScope.split(':');
    targetProject = projects.find(p => p.id === pId) || null;
    if (targetProject) {
      targetUnit = targetProject.units.find(u => u.id === uId) || null;
    }
  } else if (selectedScope.startsWith('proj:')) {
    const [, pId] = selectedScope.split(':');
    targetProject = projects.find(p => p.id === pId) || null;
  }

  if (!targetProject) {
    targetProject = projects[0];
  }

  const projectUnits = targetProject?.units || [];
  const isUnitScope = !!targetUnit;
  const overallPct = isUnitScope && targetUnit
    ? calculateUnitProgress(targetUnit)
    : (targetProject ? calculateProjectProgress(targetProject) : 0);
  const unitsToReport = isUnitScope && targetUnit ? [targetUnit] : projectUnits;

  // Aggregate trade metrics for the report
  const tradeSummaries = MASTER_TRADES_TEMPLATE.map(tm => {
    let total = 0;
    let done = 0;
    const itemsDetailed: Array<{ unitName: string; item: any }> = [];

    unitsToReport.forEach(u => {
      const t = u.trades.find(x => x.id === tm.id);
      if (t) {
        t.items.forEach(i => {
          total++;
          if (i.completed) done++;
          itemsDetailed.push({ unitName: u.name, item: i });
        });
      }
    });

    return {
      id: tm.id,
      name: tm.name,
      shortName: tm.shortName,
      total,
      done,
      pct: total === 0 ? 0 : Math.round((done / total) * 100),
      items: itemsDetailed
    };
  });

  let totalPhotos = 0;
  let totalComments = 0;
  tradeSummaries.forEach(ts => {
    ts.items.forEach(it => {
      totalPhotos += (it.item.photos ? it.item.photos.length : 0);
      if (it.item.comment) totalComments++;
    });
  });

  // Executive Gantt Timeline for Target Project (Safely evaluated without conditional hook violation)
  const ganttData = (() => {
    if (!targetProject) return null;
    const tasks = targetProject.calendarEvents || [];
    const milestones = targetProject.milestones || [];

    if (tasks.length === 0 && milestones.length === 0) {
      return null;
    }

    const parseDate = (dStr?: string): Date | null => {
      if (!dStr || typeof dStr !== 'string') return null;
      try {
        const clean = dStr.split('T')[0].trim();
        const parts = clean.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        const d = new Date(dStr);
        return isNaN(d.getTime()) ? null : d;
      } catch {
        return null;
      }
    };

    // Collect all valid dates
    const validDates: Date[] = [];
    [targetProject.startDate, targetProject.estimatedEndDate].forEach(ds => {
      const d = parseDate(ds);
      if (d) validDates.push(d);
    });
    tasks.forEach(t => {
      const d1 = parseDate(t.startDate);
      const d2 = parseDate(t.date);
      if (d1) validDates.push(d1);
      if (d2) validDates.push(d2);
    });
    milestones.forEach(m => {
      const d1 = parseDate(m.startDate);
      const d2 = parseDate(m.targetDate);
      if (d1) validDates.push(d1);
      if (d2) validDates.push(d2);
    });

    const now = new Date();
    let minD = validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : now;
    let maxD = validDates.length > 0 ? new Date(Math.max(...validDates.map(d => d.getTime()))) : now;

    // Expand to cover full months and ensure at least 3 months window
    const startYear = minD.getFullYear();
    const startMonth = minD.getMonth();
    const startDate = new Date(startYear, startMonth, 1);

    let endYear = maxD.getFullYear();
    let endMonth = maxD.getMonth();
    const monthDiff = (endYear - startYear) * 12 + (endMonth - startMonth);
    if (monthDiff < 3) {
      endMonth += (3 - monthDiff);
      if (endMonth > 11) {
        endYear += Math.floor(endMonth / 12);
        endMonth = endMonth % 12;
      }
    }
    const endDate = new Date(endYear, endMonth + 1, 0);

    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Generate month segments for header
    const months: { name: string; year: number; widthPct: number }[] = [];
    let curMonthDate = new Date(startDate);
    let iter = 0;
    while (curMonthDate <= endDate && iter < 36) {
      iter++;
      const y = curMonthDate.getFullYear();
      const m = curMonthDate.getMonth();
      const daysInM = new Date(y, m + 1, 0).getDate();
      const mName = curMonthDate.toLocaleDateString('es-ES', { month: 'short' });
      months.push({
        name: mName.toUpperCase(),
        year: y,
        widthPct: (daysInM / totalDays) * 100
      });
      curMonthDate = new Date(y, m + 1, 1);
    }

    const getDayOffset = (dateStr?: string) => {
      const d = parseDate(dateStr);
      if (!d) return 0;
      const diff = Math.round((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, Math.min(totalDays, diff));
    };

    const getPercentPosition = (startStr?: string, endStr?: string) => {
      const s = startStr || endStr;
      const e = endStr || startStr;
      const startDay = getDayOffset(s);
      const endDay = Math.max(startDay + 2, getDayOffset(e));
      const leftPct = (startDay / totalDays) * 100;
      const widthPct = Math.max(2.5, Math.min(100 - leftPct, ((endDay - startDay) / totalDays) * 100));
      return { leftPct, widthPct };
    };

    return {
      startDate,
      endDate,
      totalDays,
      months,
      getPercentPosition,
      tasks,
      milestones
    };
  })();

  const now = new Date();
  const dateString = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-t-2xl sm:rounded-2xl max-h-[96vh] flex flex-col shadow-2xl border-t-4 border-amber-500 overflow-hidden">
        {/* Non-Printable Header Bar */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white leading-tight">
                Reporte Técnico de Inspección
              </h3>
              <p className="text-[10px] text-amber-400 font-bold">
                Exportación Oficial PDF / A4 de Obra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow touch-target active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-white border border-slate-700 transition-all touch-target shrink-0 z-20 flex items-center justify-center active:scale-95 shadow-xs"
              title="Cerrar informe"
              aria-label="Cerrar informe"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Non-Printable Controls Box */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 no-print space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Alcance del Informe
              </label>
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white p-2 shadow-xs text-slate-800"
              >
                {projects.map(p => (
                  <optgroup key={p.id} label={`Obra: ${p.name}`}>
                    <option value={`proj:${p.id}`}>
                      📋 Obra Completa: {p.name} ({p.units.length} Deptos)
                    </option>
                    {p.units.map(u => (
                      <option key={u.id} value={`unit:${p.id}:${u.id}`}>
                        &nbsp;&nbsp;↳ Unidad: {u.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Inspector / Supervisor Responsable
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white p-2 shadow-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-slate-700">
            <span className="font-bold text-[10px] uppercase text-slate-600">Incluir en PDF:</span>

            <label className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer shadow-2xs hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={includeGantt}
                onChange={(e) => setIncludeGantt(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-600" />
                Diagrama de Gantt
              </span>
            </label>

            <label className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer shadow-2xs hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={includeUnitsProgress}
                onChange={(e) => setIncludeUnitsProgress(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-600" />
                Avance por Depto ({projectUnits.length})
              </span>
            </label>

            <label className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer shadow-2xs hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-[11px] font-semibold text-slate-800">
                Evidencias ({totalPhotos})
              </span>
            </label>

            <label className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer shadow-2xs hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={includeComments}
                onChange={(e) => setIncludeComments(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-amber-600" />
                Notas ({totalComments})
              </span>
            </label>

            <label className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer shadow-2xs hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-[11px] font-semibold text-slate-800">
                Firmas
              </span>
            </label>
          </div>
        </div>

        {/* Printable Document Sheet - Panoramic Landscape Layout */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/80">
          <div className="bg-white shadow-xl max-w-5xl w-full mx-auto rounded-lg p-5 sm:p-8 text-slate-900 border border-slate-300 printable-document-container">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-lg p-1 bg-white border border-slate-300 flex items-center justify-center flex-shrink-0">
                  <img
                    src={headerLogoUrl}
                    alt="Logo Obra"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-[9px] font-black tracking-widest uppercase bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                    Acta de Inspección Técnica
                  </span>
                  <h2 className="text-base font-black text-slate-900 uppercase mt-0.5">
                    {targetProject.name}
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    {targetProject.location}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="inline-block px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-center">
                  <span className="text-xl font-black font-mono text-slate-900">
                    {overallPct}%
                  </span>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">
                    Avance Auditado
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs mb-4">
              <div>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Alcance</span>
                <span className="font-bold text-slate-800">
                  {isUnitScope ? targetUnit!.name : `Toda la Obra (${targetProject.units.length} Deptos)`}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Fecha Emisión</span>
                <span className="font-bold text-slate-800">{dateString}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Hora</span>
                <span className="font-bold text-slate-800">{timeString} hs</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Inspector</span>
                <span className="font-bold text-slate-800 truncate block">{inspectorName}</span>
              </div>
            </div>

            {/* Specialty Breakdown */}
            <div className="mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
                1. Consolidado de Avance por Especialidad / Gremio
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {tradeSummaries.map(ts => (
                  <div
                    key={ts.id}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800">{ts.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {ts.done}/{ts.total}
                      </span>
                      <span className={`font-mono font-bold ${ts.pct === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {ts.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Executive Gantt Chart Section */}
            {includeGantt && ganttData && (
              <div className="mb-6 page-break-inside-avoid">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    2. Cronograma de Obra y Diagrama de Gantt
                  </h4>
                  <span className="text-[10px] font-bold text-slate-600 font-mono">
                    Período: {ganttData.startDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })} — {ganttData.endDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Timeline Box */}
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50/50 shadow-2xs">
                  {/* Timeline Header (Months) */}
                  <div className="flex border-b border-slate-300 bg-slate-100 text-[10px] font-black text-slate-700">
                    <div className="w-40 p-1.5 border-r border-slate-300 shrink-0 uppercase tracking-wider text-slate-500 text-[9px] font-black">
                      Responsable / Cuadrilla
                    </div>
                    <div className="flex-1 flex relative">
                      {ganttData.months.map((m, idx) => (
                        <div
                          key={idx}
                          style={{ width: `${m.widthPct}%` }}
                          className="p-1 text-center border-r border-slate-200 truncate text-[9px] font-bold text-slate-700 bg-slate-100"
                        >
                          {m.name} {m.year}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestones Track */}
                  {ganttData.milestones.length > 0 && (
                    <div className="flex items-center border-b border-slate-200 bg-amber-50/50 py-1.5">
                      <div className="w-40 px-2 text-[10px] font-black text-amber-900 shrink-0 flex items-center gap-1">
                        <Flag className="w-3 h-3 text-amber-600" />
                        <span>Hitos Clave ({ganttData.milestones.length})</span>
                      </div>
                      <div className="flex-1 relative h-6">
                        {ganttData.milestones.map((m, idx) => {
                          const pos = ganttData.getPercentPosition(m.startDate || m.targetDate, m.targetDate);
                          const isDone = m.manualCompleted || (m.progressPercentage !== undefined && m.progressPercentage >= 100);
                          return (
                            <div
                              key={m.id || idx}
                              style={{ left: `${pos.leftPct}%` }}
                              className={`absolute top-0.5 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black shadow-2xs whitespace-nowrap z-10 ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-500 text-slate-950'
                              }`}
                              title={`${m.name} (${m.targetDate})`}
                            >
                              <span>◆</span>
                              <span className="truncate max-w-[120px]">{m.name}</span>
                              <span className="opacity-90 font-mono text-[7px]">{formatPMDate(m.targetDate)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Task Rows */}
                  <div className="divide-y divide-slate-200 text-xs">
                    {ganttData.tasks.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 text-[11px] italic">
                        No hay tareas programadas para esta obra.
                      </div>
                    ) : (
                      ganttData.tasks.map((task, idx) => {
                        const pos = ganttData.getPercentPosition(task.startDate || task.date, task.date);
                        const progress = task.progress !== undefined ? task.progress : (task.completed ? 100 : 0);
                        const isDone = task.completed || progress === 100;
                        const alarms = getTaskAlarms(task);
                        const isCritical = alarms.isCriticalDelay;

                        const barColor = isDone
                          ? 'bg-emerald-600'
                          : isCritical
                          ? 'bg-rose-600'
                          : 'bg-cyan-600';

                        const barBg = isDone
                          ? 'bg-emerald-100/80 border-emerald-300'
                          : isCritical
                          ? 'bg-rose-100/80 border-rose-300'
                          : 'bg-cyan-100/80 border-cyan-300';

                        return (
                          <div key={task.id || idx} className="flex items-center hover:bg-slate-50 transition-colors py-1">
                            <div className="w-40 px-2 shrink-0 truncate">
                              <span className="font-bold text-[10px] text-slate-900 block truncate leading-tight">
                                {task.assignedTo || 'Cuadrilla General'}
                              </span>
                              <span className="text-[8px] text-slate-500 truncate block">
                                {task.assignedRole || task.category || 'Tareas Generales'}
                              </span>
                            </div>
                            <div className="flex-1 relative h-6 bg-slate-100/60 rounded">
                              <div
                                style={{
                                  left: `${pos.leftPct}%`,
                                  width: `${pos.widthPct}%`
                                }}
                                className={`absolute top-0.5 bottom-0.5 rounded border ${barBg} flex items-center px-1.5 overflow-hidden shadow-2xs`}
                              >
                                {/* Progress fill */}
                                <div
                                  style={{ width: `${progress}%` }}
                                  className={`absolute left-0 top-0 bottom-0 ${barColor} opacity-80 transition-all`}
                                />
                                <div className="relative z-10 flex items-center justify-between w-full gap-1 text-[9px] font-black text-slate-900 truncate">
                                  <span className="truncate">{task.title}</span>
                                  <span className="font-mono text-[8px] bg-white/95 px-1 py-0.2 rounded shadow-2xs shrink-0 font-bold">
                                    {progress}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Timeline Metrics Footer */}
                <div className="grid grid-cols-4 gap-2 mt-2 text-center text-xs">
                  <div className="bg-slate-100 p-1.5 rounded border border-slate-200">
                    <span className="block text-[8px] font-bold text-slate-500 uppercase">Total Tareas</span>
                    <span className="font-mono font-black text-slate-800 text-xs">{ganttData.tasks.length}</span>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded border border-emerald-200">
                    <span className="block text-[8px] font-bold text-emerald-700 uppercase">Completadas</span>
                    <span className="font-mono font-black text-emerald-800 text-xs">
                      {ganttData.tasks.filter(t => t.completed || t.progress === 100).length}
                    </span>
                  </div>
                  <div className="bg-cyan-50 p-1.5 rounded border border-cyan-200">
                    <span className="block text-[8px] font-bold text-cyan-700 uppercase">En Curso</span>
                    <span className="font-mono font-black text-cyan-800 text-xs">
                      {ganttData.tasks.filter(t => !t.completed && (t.progress || 0) > 0 && (t.progress || 0) < 100).length}
                    </span>
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded border border-amber-200">
                    <span className="block text-[8px] font-bold text-amber-700 uppercase">Hitos de Obra</span>
                    <span className="font-mono font-black text-amber-800 text-xs">{ganttData.milestones.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Department / Units Individual Progress Section */}
            {includeUnitsProgress && projectUnits.length > 0 && (
              <div className="mb-6 page-break-inside-avoid">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    3. Porcentaje de Avance Individual por Departamento ({projectUnits.length} Unidades)
                  </h4>
                  <span className="text-[10px] font-bold text-slate-600 font-mono">
                    Auditoría Sectorizada
                  </span>
                </div>

                {/* Units Summary Metrics */}
                {(() => {
                  const unitsStats = projectUnits.map(u => {
                    const pct = calculateUnitProgress(u);
                    const counts = getUnitItemCounts(u);
                    return { unit: u, pct, counts };
                  });
                  const totalUnits = unitsStats.length;
                  const completedUnits = unitsStats.filter(u => u.pct === 100).length;
                  const inProgressUnits = unitsStats.filter(u => u.pct > 0 && u.pct < 100).length;
                  const pendingUnits = unitsStats.filter(u => u.pct === 0).length;
                  const avgPct = totalUnits > 0
                    ? Math.round(unitsStats.reduce((acc, u) => acc + u.pct, 0) / totalUnits)
                    : 0;

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                          <span className="block text-[8px] font-bold text-slate-500 uppercase">Total Unidades</span>
                          <span className="font-mono font-black text-slate-800 text-sm">{totalUnits}</span>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                          <span className="block text-[8px] font-bold text-emerald-700 uppercase">Finalizadas (100%)</span>
                          <span className="font-mono font-black text-emerald-800 text-sm">{completedUnits}</span>
                        </div>
                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <span className="block text-[8px] font-bold text-amber-700 uppercase">En Ejecución</span>
                          <span className="font-mono font-black text-amber-800 text-sm">{inProgressUnits}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="block text-[8px] font-bold text-slate-500 uppercase">Pendientes (0%)</span>
                          <span className="font-mono font-black text-slate-700 text-sm">{pendingUnits}</span>
                        </div>
                        <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-200 col-span-2 sm:col-span-1">
                          <span className="block text-[8px] font-bold text-indigo-700 uppercase">Promedio Obra</span>
                          <span className="font-mono font-black text-indigo-800 text-sm">{avgPct}%</span>
                        </div>
                      </div>

                      {/* Panoramic 3-column Units Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                        {unitsStats.map(({ unit, pct, counts }) => {
                          const isComplete = pct === 100;
                          const isPartial = pct > 0 && !isComplete;
                          const isTargetScope = targetUnit && targetUnit.id === unit.id;

                          return (
                            <div
                              key={unit.id}
                              className={`p-2.5 rounded-lg border transition-all ${
                                isTargetScope
                                  ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40'
                                  : isComplete
                                  ? 'bg-emerald-50/50 border-emerald-300'
                                  : isPartial
                                  ? 'bg-white border-slate-200'
                                  : 'bg-slate-50/60 border-slate-200 opacity-80'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div>
                                  <h5 className="font-black text-xs text-slate-900 leading-tight">
                                    {unit.name}
                                  </h5>
                                  <span className="text-[9px] text-slate-500 font-medium">
                                    {unit.floorLabel || unit.category || (unit.type === 'common_area' ? 'Área Común' : 'Departamento')}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className={`font-mono font-black text-sm ${
                                    isComplete ? 'text-emerald-700' : isPartial ? 'text-amber-700' : 'text-slate-400'
                                  }`}>
                                    {pct}%
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1.5">
                                <div
                                  style={{ width: `${pct}%` }}
                                  className={`h-full rounded-full transition-all ${
                                    isComplete
                                      ? 'bg-emerald-600'
                                      : isPartial
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                  }`}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                                <span>{counts.completed} de {counts.total} ítems</span>
                                {unit.signature ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                    <Check className="w-3 h-3 stroke-[3]" /> Firmado
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Sin firmar</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 4. Checklist Details and Photo Evidence */}
            <div className="mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
                4. Detalle de Control y Evidencias Fotográficas ({totalPhotos} Fotos)
              </h4>

              {tradeSummaries.map(ts => (
                <div key={ts.id} className="mb-3 page-break-inside-avoid">
                  <div className="bg-slate-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex justify-between items-center mb-1.5">
                    <span>{ts.name}</span>
                    <span className="text-amber-400 font-mono">{ts.pct}%</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {ts.items.map((itObj, idx) => {
                      const item = itObj.item;
                      const hasPhotos = includePhotos && item.photos && item.photos.length > 0;

                      const itemPct = item.progressPercentage !== undefined ? item.progressPercentage : (item.completed ? 100 : 0);
                      const isComplete = item.completed || itemPct === 100;
                      const isPartial = !isComplete && itemPct > 0;

                      return (
                        <div
                          key={item.id || idx}
                          className={`p-2 border rounded-lg ${
                            isComplete
                              ? 'bg-emerald-50/40 border-emerald-300'
                              : isPartial
                              ? 'bg-amber-50/40 border-amber-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-black ${
                                isComplete 
                                  ? 'text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded' 
                                  : isPartial
                                  ? 'text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded'
                                  : 'text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded'
                              }`}>
                                {isComplete ? '✔ APROBADO (100%)' : isPartial ? `⏳ EN CURSO (${itemPct}%)` : '○ PENDIENTE (0%)'}
                              </span>
                              <span className={`font-bold ${isComplete ? 'text-emerald-800' : 'text-slate-900'}`}>
                                {item.name}
                              </span>
                              {!isUnitScope && (
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                  {itObj.unitName}
                                </span>
                              )}
                            </div>

                            {hasPhotos && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                                {item.photos.length} Foto(s)
                              </span>
                            )}
                          </div>

                          {/* Technical Observation / Note */}
                          {includeComments && item.comment && (
                            <div className={`mt-1.5 text-[11px] rounded-md px-2.5 py-1.5 flex items-start gap-1.5 border ${
                              item.severity === 'high'
                                ? 'bg-rose-50 border-rose-300 text-rose-950'
                                : item.severity === 'medium'
                                ? 'bg-amber-50 border-amber-300 text-amber-950'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}>
                              <span className="font-bold flex-shrink-0 text-[10px] uppercase tracking-wide">
                                💬 Observación {item.severity === 'high' ? '• CRÍTICA' : item.severity === 'medium' ? '• MEDIA' : '• LEVE'}:
                              </span>
                              <span className="font-medium leading-snug">
                                {item.comment}
                              </span>
                            </div>
                          )}

                          {/* Photos Evidence Grid */}
                          {hasPhotos && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200">
                              {item.photos.map((ph: any, pIdx: number) => (
                                <div
                                  key={ph.id || pIdx}
                                  className="rounded-lg overflow-hidden border border-slate-300 bg-white p-1 shadow-2xs"
                                >
                                  <img
                                    src={ph.dataUrl}
                                    alt={`Evidencia ${pIdx + 1}`}
                                    className="w-full h-24 object-contain bg-slate-100 rounded"
                                  />
                                  <span className="block text-[8px] text-slate-500 mt-1 font-mono text-center truncate">
                                    {ph.timestamp || 'Inspección'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Signatures & Acceptance Certificate */}
            {includeSignatures && (
              <div className="mt-8 pt-4 border-t-2 border-slate-900 page-break-inside-avoid">
                <h4 className="text-xs font-black uppercase text-slate-800 mb-6 text-center">
                  5. Firmas de Conformidad y Recepción Técnica
                </h4>

                {isUnitScope && targetUnit?.signature ? (
                  <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl mb-4">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          ✔ Acta Digitalmente Firmada y Aprobada
                        </span>
                        <h5 className="font-bold text-slate-900 text-xs mt-1">
                          Recepción Técnica de: {targetUnit.name}
                        </h5>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 font-mono">
                        <span>Registrada: {targetUnit.signedAt || dateString}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 items-end text-xs">
                      {/* Captured Digital Signature Box */}
                      <div className="text-center">
                        <div className="h-16 flex items-center justify-center bg-white border border-dashed border-slate-300 rounded-lg p-1 mb-1 shadow-2xs">
                          <img
                            src={targetUnit.signature}
                            alt="Firma Digital"
                            className="max-h-14 max-w-full object-contain"
                          />
                        </div>
                        <p className="font-black text-slate-900 text-xs">{targetUnit.signedBy || inspectorName}</p>
                        <p className="text-[10px] text-slate-600 font-bold">{targetUnit.signRole || 'Supervisor Técnico de Obra'}</p>
                        {targetUnit.signDni && (
                          <p className="text-[9px] text-slate-500 font-mono">{targetUnit.signDni}</p>
                        )}
                      </div>

                      {/* Direction / Contractor Block */}
                      <div className="text-center">
                        <div className="border-b border-slate-900 h-16 mb-1 flex items-end justify-center pb-1">
                          <span className="text-[10px] text-slate-400 italic">Sello / Rúbrica Dirección</span>
                        </div>
                        <p className="font-bold text-slate-900">Dirección de Obra / Ejecución</p>
                        <p className="text-[10px] text-slate-500">Constatación y Cierre de Tareas</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                      <div className="border-b border-slate-900 h-14 mb-1" />
                      <p className="font-bold text-slate-900">{inspectorName}</p>
                      <p className="text-[10px] text-slate-500">Supervisión e Inspección Técnica de Obra</p>
                    </div>

                    <div>
                      <div className="border-b border-slate-900 h-14 mb-1" />
                      <p className="font-bold text-slate-900">Dirección de Obra / Contratista</p>
                      <p className="text-[10px] text-slate-500">Responsable de Ejecución en Terreno</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Non-Printable Bottom Actions */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between no-print">
          <button
            onClick={onExportJSON}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 touch-target font-medium"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Respaldo JSON</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold touch-target"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow touch-target"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
