import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  FileText,
  Calendar,
  Building2,
  UserCheck,
  CheckCircle2,
  Camera,
  Sparkles,
  Filter,
  Check,
  Percent,
  Layers,
  MapPin,
  Clock,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { Project, Unit, Trade, InspectionItem, InspectionPhoto } from '../types';
import { calculateProjectProgress } from '../utils/calculations';

interface MonthlyWorkReportModalProps {
  isOpen: boolean;
  project: Project | null;
  headerLogoUrl: string;
  onClose: () => void;
}

interface MonthlyPhotoItem {
  id: string;
  dataUrl: string;
  timestamp: string;
  dateObj: Date | null;
  unitName: string;
  tradeName: string;
  itemName: string;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Robust date parser for photos timestamps:
 * Handles 'DD/MM/YYYY, HH:MM hs', ISO strings, standard dates
 */
function parseDateFromTimestamp(timestamp?: string): Date | null {
  if (!timestamp || typeof timestamp !== 'string') return null;
  const clean = timestamp.trim();

  // Try matching DD/MM/YYYY
  const dmyMatch = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) return d;
  }

  // Try matching YYYY-MM-DD
  const ymdMatch = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback to standard parse
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) return new Date(parsed);

  return null;
}

export function MonthlyWorkReportModal({
  isOpen,
  project,
  headerLogoUrl,
  onClose
}: MonthlyWorkReportModalProps) {
  // Compute list of recent months (current month + 5 previous months)
  const availableMonths = useMemo(() => {
    const months: Array<{ value: string; label: string; year: number; monthIndex: number }> = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTH_NAMES_ES[d.getMonth()]} ${d.getFullYear()}`;
      months.push({ value: val, label, year: d.getFullYear(), monthIndex: d.getMonth() });
    }
    return months;
  }, []);

  const [selectedMonthVal, setSelectedMonthVal] = useState<string>(() => availableMonths[0]?.value || '');
  const [inspectorName, setInspectorName] = useState<string>('Arq. M. Rossi - Inspección Técnica');
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // Prevent background scroll and add isolation class when opened
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('report-modal-open');
      return () => {
        document.body.classList.remove('report-modal-open');
      };
    }
  }, [isOpen]);

  // Extract all photos from the project and filter for the selected month
  const { allMonthlyPhotos, totalPhotosFound } = useMemo(() => {
    if (!project) return { allMonthlyPhotos: [], totalPhotosFound: 0 };

    const selectedPeriod = availableMonths.find(m => m.value === selectedMonthVal) || availableMonths[0];
    const targetYear = selectedPeriod ? selectedPeriod.year : new Date().getFullYear();
    const targetMonth = selectedPeriod ? selectedPeriod.monthIndex : new Date().getMonth();

    const collected: MonthlyPhotoItem[] = [];

    // 1. Collect photos from all unit checklist items
    (project.units || []).forEach(unit => {
      (unit.trades || []).forEach(trade => {
        (trade.items || []).forEach(item => {
          (item.photos || []).forEach(photo => {
            if (!photo.dataUrl) return;
            const d = parseDateFromTimestamp(photo.timestamp);
            
            // If date matches target month and year, OR if photo was uploaded recently
            let matchesMonth = false;
            if (d) {
              matchesMonth = d.getFullYear() === targetYear && d.getMonth() === targetMonth;
            } else {
              // If timestamp couldn't be parsed, include if target month is current month
              matchesMonth = targetMonth === new Date().getMonth() && targetYear === new Date().getFullYear();
            }

            if (matchesMonth) {
              collected.push({
                id: photo.id,
                dataUrl: photo.dataUrl,
                timestamp: photo.timestamp || 'Fecha no registrada',
                dateObj: d,
                unitName: unit.name,
                tradeName: trade.name,
                itemName: item.name
              });
            }
          });
        });
      });

      // 2. Also check unit sketches created in this month
      (unit.sketches || []).forEach(sketch => {
        if (!sketch.dataUrl) return;
        const d = parseDateFromTimestamp(sketch.createdAt);
        let matchesMonth = false;
        if (d) {
          matchesMonth = d.getFullYear() === targetYear && d.getMonth() === targetMonth;
        } else {
          matchesMonth = targetMonth === new Date().getMonth() && targetYear === new Date().getFullYear();
        }

        if (matchesMonth) {
          collected.push({
            id: sketch.id,
            dataUrl: sketch.dataUrl,
            timestamp: sketch.createdAt || 'Croquis',
            dateObj: d,
            unitName: unit.name,
            tradeName: sketch.tradeName || 'Relevamiento Gráfico',
            itemName: sketch.itemName || sketch.title || 'Croquis de Obra'
          });
        }
      });
    });

    // 3. Also check milestone photos
    (project.milestones || []).forEach(m => {
      (m.photos || []).forEach((photoUrl, idx) => {
        const d = parseDateFromTimestamp(m.targetDate || (m as any).endDate);
        let matchesMonth = false;
        if (d) {
          matchesMonth = d.getFullYear() === targetYear && d.getMonth() === targetMonth;
        } else {
          matchesMonth = targetMonth === new Date().getMonth() && targetYear === new Date().getFullYear();
        }

        if (matchesMonth) {
          collected.push({
            id: `milestone_photo_${m.id}_${idx}`,
            dataUrl: photoUrl,
            timestamp: m.targetDate ? `Hito: ${m.targetDate}` : 'Hito de Obra',
            dateObj: d,
            unitName: m.buildingPart || 'Estructura Global',
            tradeName: m.tradeCategory || 'Hito Crítico',
            itemName: m.name
          });
        }
      });
    });

    return {
      allMonthlyPhotos: collected,
      totalPhotosFound: collected.length
    };
  }, [project, selectedMonthVal, availableMonths]);

  // Initial selection of all photos when month changes or modal opens
  useEffect(() => {
    if (allMonthlyPhotos.length > 0) {
      setSelectedPhotoIds(new Set(allMonthlyPhotos.map(p => p.id)));
    } else {
      setSelectedPhotoIds(new Set());
    }
  }, [allMonthlyPhotos]);

  // Auto-generate suggested executive summary when month or project changes
  useEffect(() => {
    if (!project) return;
    const selectedPeriod = availableMonths.find(m => m.value === selectedMonthVal) || availableMonths[0];
    const monthName = selectedPeriod?.label || 'el mes en curso';
    const progress = calculateProjectProgress(project);

    // Collect active trade names from photos or units
    const activeTradeNames = Array.from(new Set(allMonthlyPhotos.map(p => p.tradeName))).slice(0, 4);
    const tradesText = activeTradeNames.length > 0
      ? `los rubros de ${activeTradeNames.join(', ')}`
      : 'las tareas programadas de albañilería, instalaciones y terminaciones';

    const defaultText = `Durante el período de ${monthName}, las tareas en obra se desarrollaron con normalidad conforme al plan de avance previsto. Se concentraron los esfuerzos en ${tradesText}, alcanzando un avance físico general del ${progress}%. Las inspecciones en sitio confirman la correcta ejecución técnica y cumplimiento de las directivas de calidad para el complejo.`;

    setExecutiveSummary(defaultText);
  }, [project, selectedMonthVal, availableMonths, allMonthlyPhotos.length]);

  if (!isOpen || !project) return null;

  const overallProgress = calculateProjectProgress(project);
  const totalUnits = project.units ? project.units.length : 0;
  const completedUnits = (project.units || []).filter(u => {
    const total = u.trades.reduce((acc, t) => acc + t.items.length, 0);
    const done = u.trades.reduce((acc, t) => acc + t.items.filter(i => i.completed).length, 0);
    return total > 0 && done === total;
  }).length;

  const selectedPeriod = availableMonths.find(m => m.value === selectedMonthVal) || availableMonths[0];
  const currentDateFormatted = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const filteredPhotos = allMonthlyPhotos.filter(p => {
    if (filterUnit !== 'all' && p.unitName !== filterUnit) return false;
    return true;
  });

  const photosToPrint = filteredPhotos.filter(p => selectedPhotoIds.has(p.id));

  const handlePrint = () => {
    window.print();
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const selectAllPhotos = () => {
    setSelectedPhotoIds(new Set(filteredPhotos.map(p => p.id)));
  };

  const deselectAllPhotos = () => {
    setSelectedPhotoIds(new Set());
  };

  return (
    <div className="report-modal-backdrop fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 overflow-y-auto">
      <div className="report-modal-dialog bg-white w-full max-w-5xl rounded-t-2xl sm:rounded-2xl max-h-[96vh] flex flex-col shadow-2xl border-t-4 border-cyan-500 overflow-hidden text-slate-900">
        
        {/* NON-PRINTABLE TOP CONTROLS BAR */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 no-print flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm text-white leading-tight truncate">
                Informe Mensual de Obra
              </h3>
              <p className="text-[11px] text-cyan-400 font-bold truncate">
                {project.name} • Reporte para Propietarios y Comitentes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={selectedMonthVal}
                onChange={(e) => setSelectedMonthVal(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-hidden cursor-pointer"
                title="Seleccionar período a reportar"
              >
                {availableMonths.map(m => (
                  <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Print / Export Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              title="Generar e imprimir el informe en PDF"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Imprimir / Guardar PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-white border border-slate-700 transition-all shrink-0 active:scale-95 shadow-xs"
              title="Cerrar informe"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* NON-PRINTABLE CONFIG BAR (Inspector name & Photo filter) */}
        <div className="px-4 py-2.5 bg-slate-800/90 text-slate-300 border-b border-slate-700 text-xs no-print flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold text-[11px] text-slate-400 shrink-0">Supervisor / Responsable:</span>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Nombre y cargo del responsable técnico"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-bold text-slate-400 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fotos del mes:</span>
              <strong className="text-white">{photosToPrint.length} de {filteredPhotos.length}</strong>
            </span>

            {filteredPhotos.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={selectAllPhotos}
                  className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-cyan-300 font-bold transition-colors"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={deselectAllPhotos}
                  className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 font-bold transition-colors"
                >
                  Ninguna
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PRINTABLE REPORT CONTENT BODY */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-100 text-slate-900 custom-scrollbar report-sheet-wrapper">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden printable-document-container p-6 sm:p-8 space-y-6">
            
            {/* 1. OFFICIAL COMPANY HEADER */}
            <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
              <div className="flex items-start gap-4">
                {headerLogoUrl ? (
                  <img
                    src={headerLogoUrl}
                    alt="Logo Empresa"
                    className="h-14 sm:h-16 max-w-[180px] object-contain shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-950 text-cyan-400 flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                    CA
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-cyan-100 text-cyan-900 border border-cyan-300">
                    Informe Oficial de Avance
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 leading-tight">
                    {project.name}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium flex items-center gap-2 mt-0.5">
                    {project.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{project.location}</span>
                      </span>
                    )}
                    {project.expediente && (
                      <span className="font-mono text-slate-500">
                        • Exp: {project.expediente}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Período
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900">
                  {selectedPeriod?.label}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Emitido: {currentDateFormatted}
                </div>
              </div>
            </div>

            {/* 2. PROJECT METRICS SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Porcentaje Acumulado */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-cyan-600" />
                  Avance Físico Total
                </span>
                <div className="my-2">
                  <span className="text-3xl font-black text-slate-900">
                    {overallProgress}%
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5 font-bold">acumulado</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 rounded-full transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Unidades / Espacios */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  Unidades y Espacios
                </span>
                <div className="my-2">
                  <span className="text-3xl font-black text-slate-900">
                    {totalUnits}
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5 font-bold">sectores totales</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {completedUnits} unidades finalizadas (100%)
                </p>
              </div>

              {/* Card 3: Supervisión Técnica */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Dirección Técnica
                </span>
                <div className="my-2">
                  <p className="text-sm font-black text-slate-900 truncate">
                    {inspectorName || 'Inspección de Obra'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {project.client ? `Comitente: ${project.client}` : 'Control y Seguimiento'}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-block w-fit">
                  Inspección Conforme
                </span>
              </div>
            </div>

            {/* 3. RESUMEN CORTO DE TRABAJOS DEL MES (Editable on screen) */}
            <div className="rounded-xl border border-slate-200 p-4 sm:p-5 bg-white space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  Resumen Ejecutivo de Trabajos del Mes
                </h3>
                <span className="text-[10px] font-bold text-slate-400 no-print">
                  Editable para el informe
                </span>
              </div>

              {/* On-screen editable textarea */}
              <div className="no-print">
                <textarea
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed focus:bg-white focus:border-cyan-500 focus:outline-hidden"
                  placeholder="Redacta aquí el resumen de trabajos ejecutados durante el mes..."
                />
              </div>

              {/* Print-only clean formatted typography */}
              <div className="hidden print:block text-xs sm:text-sm text-slate-800 leading-relaxed text-justify whitespace-pre-line pt-1">
                {executiveSummary}
              </div>
            </div>

            {/* 4. FOTOS DE AVANCE DEL MES (Dossier Fotográfico) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
                    Fotos de Avance del Mes ({photosToPrint.length})
                  </h3>
                </div>

                <span className="text-xs text-slate-500 font-bold">
                  Registro fotográfico correspondiente a {selectedPeriod?.label}
                </span>
              </div>

              {photosToPrint.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl space-y-2">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    No se registran fotografías en este período ({selectedPeriod?.label})
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Puedes seleccionar otro mes en el selector superior o cargar nuevas fotografías en los departamentos para incluirlas en el próximo informe.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {photosToPrint.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col page-break-inside-avoid"
                    >
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden group">
                        <img
                          src={photo.dataUrl}
                          alt={photo.itemName}
                          className="w-full h-full object-cover"
                        />

                        {/* Top selection checkbox (No-print) */}
                        <div className="absolute top-2 right-2 no-print">
                          <button
                            type="button"
                            onClick={() => togglePhotoSelection(photo.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition-all ${
                              selectedPhotoIds.has(photo.id)
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-900/80 text-white hover:bg-slate-900'
                            }`}
                            title="Incluir / excluir esta foto del informe"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>

                        {/* Timestamp badge */}
                        <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[9.5px] font-mono px-2 py-0.5 rounded-md border border-white/20">
                          {photo.timestamp}
                        </div>
                      </div>

                      {/* Photo Caption */}
                      <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-200 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-900 border border-cyan-300">
                              {photo.unitName}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                              {photo.tradeName}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">
                            {photo.itemName}
                          </h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. FORMAL SIGNATURE BLOCKS */}
            <div className="pt-8 mt-6 border-t-2 border-slate-900 page-break-inside-avoid">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-48 border-b-2 border-slate-800 pb-12 mb-2" />
                  <p className="text-xs font-black text-slate-900">
                    {inspectorName || 'Dirección de Obra'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Supervisión Técnica
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-48 border-b-2 border-slate-800 pb-12 mb-2" />
                  <p className="text-xs font-black text-slate-900">
                    {project.client || 'Comitente / Propietario'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Recepción del Informe
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
