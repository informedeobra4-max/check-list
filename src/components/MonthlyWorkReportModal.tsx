import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Calendar,
  Building2,
  Camera,
  Sparkles,
  Upload,
  Check,
  Plus,
  Trash2,
  Pencil,
  Image as ImageIcon,
  Sliders,
  Eye,
  Settings2,
  Layers,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { Project, Unit, Trade, InspectionItem, InspectionPhoto } from '../types';

interface MonthlyWorkReportModalProps {
  isOpen: boolean;
  project: Project | null;
  headerLogoUrl?: string;
  onClose: () => void;
  onUpdateProject?: (updatedProject: Project) => void;
}

interface MonthlyPhotoItem {
  id: string;
  dataUrl: string;
  timestamp: string;
  dateObj: Date | null;
  unitName: string;
  tradeName: string;
  itemName: string;
  customTitle?: string;
}

interface WorkStageRow {
  id: string;
  percentage: number;
  label: string;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const STORAGE_KEY_DEV_LOGO = 'CONTROL_AVANCE_DEVELOPER_LOGO';
const STORAGE_KEY_DEV_NAME = 'CONTROL_AVANCE_DEVELOPER_NAME';

function parseDateFromTimestamp(timestamp?: string): Date | null {
  if (!timestamp || typeof timestamp !== 'string') return null;
  const clean = timestamp.trim();

  const dmyMatch = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) return d;
  }

  const ymdMatch = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) return d;
  }

  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) return new Date(parsed);

  return null;
}

export function MonthlyWorkReportModal({
  isOpen,
  project,
  headerLogoUrl,
  onClose,
  onUpdateProject
}: MonthlyWorkReportModalProps) {
  // Available months list (last 12 months)
  const availableMonths = useMemo(() => {
    const months: Array<{ value: string; label: string; year: number; monthIndex: number }> = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTH_NAMES_ES[d.getMonth()]} ${d.getFullYear()}`;
      months.push({ value: val, label, year: d.getFullYear(), monthIndex: d.getMonth() });
    }
    return months;
  }, []);

  const [selectedMonthVal, setSelectedMonthVal] = useState<string>(() => availableMonths[0]?.value || '');
  const [activeConfigTab, setActiveConfigTab] = useState<'preview' | 'logos' | 'stages' | 'text' | 'photos'>('preview');

  // 1. Dynamic Logos State
  const [developerLogo, setDeveloperLogo] = useState<string>(() => {
    return project?.developerLogoUrl || localStorage.getItem(STORAGE_KEY_DEV_LOGO) || '';
  });
  const [developerName, setDeveloperName] = useState<string>(() => {
    return project?.developerName || localStorage.getItem(STORAGE_KEY_DEV_NAME) || 'TIERRA FIRME - DESARROLLOS SÓLIDOS';
  });
  const [projectLogo, setProjectLogo] = useState<string>(() => {
    return project?.logoUrl || '';
  });

  // 2. Headlines & Titles
  const [tagline, setTagline] = useState<string>('CONTINUAMOS A PASO FIRME !');
  const [stageHeadline, setStageHeadline] = useState<string>('TABIQUES DEL 3° PISO!!');
  const [galleryTabSubtitle, setGalleryTabSubtitle] = useState<string>('1° - 2° PISO INSTALACIONES');
  const [textTabSubtitle, setTextTabSubtitle] = useState<string>('Tabiques 3° PISO');

  // 3. Cover Hero Photo
  const [heroPhotoUrl, setHeroPhotoUrl] = useState<string>('');

  // 4. Work Stages Table Rows
  const [workStages, setWorkStages] = useState<WorkStageRow[]>([
    { id: '1', percentage: 100, label: 'Tabiques 2° piso' },
    { id: '2', percentage: 100, label: 'Losa 2° piso' },
    { id: '3', percentage: 65, label: 'Instalación eléctrica en 1° piso' },
    { id: '4', percentage: 65, label: 'Armado de tabiques 3° PISO' }
  ]);

  // 5. Structured Written Report Sections
  const [reportEstructura, setReportEstructura] = useState<string>(
    'Hormigonado y terminación de la losa del 2° piso. Ejecución de la escalera que vincula del 1° al 2° piso. Montaje de los puentes metálicos de conexión en el primer bloque del segundo nivel. Avance en la ejecución de los tabiques del 3° piso, próximos a finalizar para dar inicio a la armadura de vigas y posterior hormigonado de la losa del último piso.'
  );
  const [reportInstalaciones, setReportInstalaciones] = useState<string>(
    'El gremio de electricistas continúa trabajando en 1° y 2° piso, con el tendido de cañerías embutidas y cajas de distribución.'
  );
  const [reportAlbanileria, setReportAlbanileria] = useState<string>(
    'Ejecución de muros y revoques en el patio principal e interiores de los primeros niveles. Colocación de premarcos.'
  );
  const [reportEstado, setReportEstado] = useState<string>(
    'La obra se desarrolla de acuerdo al cronograma establecido, cumpliendo con los plazos previstos y manteniendo un ritmo sostenido de avance técnico.'
  );
  const [reportProximas, setReportProximas] = useState<string>(
    'Finalización de tabiques del 3° piso. Inicio de vigas y losa del último piso. Continuidad de instalaciones eléctricas y sanitarias en 1° y 2° piso. Avance en revoques y cerramientos en sectores comunes e internos.'
  );

  // File input refs for uploading logos and hero photo
  const devLogoInputRef = useRef<HTMLInputElement>(null);
  const projLogoInputRef = useRef<HTMLInputElement>(null);
  const heroPhotoInputRef = useRef<HTMLInputElement>(null);
  const closingPhotoInputRef = useRef<HTMLInputElement>(null);
  const [closingPhotoUrl, setClosingPhotoUrl] = useState<string>('');

  // Selected Month Breakdown
  const selectedMonthInfo = useMemo(() => {
    return availableMonths.find(m => m.value === selectedMonthVal) || availableMonths[0];
  }, [availableMonths, selectedMonthVal]);

  // Sync project logo when project prop changes
  useEffect(() => {
    if (project?.logoUrl) {
      setProjectLogo(project.logoUrl);
    }
    if (project?.developerLogoUrl) {
      setDeveloperLogo(project.developerLogoUrl);
    }
    if (project?.developerName) {
      setDeveloperName(project.developerName);
    }
  }, [project]);

  // Save developer logo & name persistently
  const handleSaveDeveloperBranding = (logo: string, name: string) => {
    setDeveloperLogo(logo);
    setDeveloperName(name);
    try {
      localStorage.setItem(STORAGE_KEY_DEV_LOGO, logo);
      localStorage.setItem(STORAGE_KEY_DEV_NAME, name);
    } catch {}
    if (project && onUpdateProject) {
      onUpdateProject({
        ...project,
        developerLogoUrl: logo,
        developerName: name
      });
    }
  };

  // Save project specific logo
  const handleSaveProjectLogo = (logo: string) => {
    setProjectLogo(logo);
    if (project && onUpdateProject) {
      onUpdateProject({
        ...project,
        logoUrl: logo
      });
    }
  };

  // Scan ALL inspection photos, sketches, and milestone photos matching selected month
  const monthlyPhotos = useMemo(() => {
    if (!project || !Array.isArray(project.units)) return [];

    const result: MonthlyPhotoItem[] = [];
    const targetYear = selectedMonthInfo.year;
    const targetMonthIndex = selectedMonthInfo.monthIndex;

    // Scan Unit trades checklist photos
    project.units.forEach(u => {
      (u.trades || []).forEach(tr => {
        (tr.items || []).forEach(it => {
          (it.photos || []).forEach(ph => {
            const date = parseDateFromTimestamp(ph.timestamp);
            if (date && date.getFullYear() === targetYear && date.getMonth() === targetMonthIndex) {
              result.push({
                id: ph.id,
                dataUrl: ph.dataUrl,
                timestamp: ph.timestamp,
                dateObj: date,
                unitName: u.name,
                tradeName: tr.name,
                itemName: it.name,
                customTitle: `${tr.name.toUpperCase()} - ${it.name.toUpperCase()}`
              });
            }
          });
        });
      });

      // Scan Unit Sketches
      (u.sketches || []).forEach(sk => {
        const date = parseDateFromTimestamp(sk.createdAt);
        if (date && date.getFullYear() === targetYear && date.getMonth() === targetMonthIndex) {
          result.push({
            id: sk.id,
            dataUrl: sk.dataUrl,
            timestamp: sk.createdAt,
            dateObj: date,
            unitName: u.name,
            tradeName: sk.tradeName || 'Croquis Técnico',
            itemName: sk.title || 'Relevamiento en Obra',
            customTitle: (sk.title || 'CROQUIS TÉCNICO').toUpperCase()
          });
        }
      });
    });

    // Scan Milestones photos
    (project.milestones || []).forEach(m => {
      (m.photos || []).forEach((photoUrl, pIdx) => {
        const date = parseDateFromTimestamp(m.startDate || m.targetDate);
        if (!date || (date.getFullYear() === targetYear && date.getMonth() === targetMonthIndex)) {
          result.push({
            id: `milestone_photo_${m.id}_${pIdx}`,
            dataUrl: photoUrl,
            timestamp: m.targetDate || selectedMonthInfo.label,
            dateObj: date,
            unitName: 'Hito Global',
            tradeName: m.tradeCategory || 'Hito',
            itemName: m.name,
            customTitle: m.name.toUpperCase()
          });
        }
      });
    });

    return result;
  }, [project, selectedMonthInfo]);

  // Selected photo IDs for gallery
  const [selectedGalleryPhotoIds, setSelectedGalleryPhotoIds] = useState<string[]>([]);
  const [photoEpigraphs, setPhotoEpigraphs] = useState<Record<string, string>>({});

  // Auto-select photos when monthlyPhotos change
  useEffect(() => {
    if (monthlyPhotos.length > 0) {
      // Pick first photo as hero photo if not set
      if (!heroPhotoUrl) {
        setHeroPhotoUrl(monthlyPhotos[0].dataUrl);
      }
      // Pick second photo as closing photo if not set
      if (!closingPhotoUrl && monthlyPhotos.length > 1) {
        setClosingPhotoUrl(monthlyPhotos[1].dataUrl);
      }
      // Select up to 4 photos for page 2 gallery
      const initialIds = monthlyPhotos.slice(0, 4).map(p => p.id);
      setSelectedGalleryPhotoIds(initialIds);

      // Initialize epigraphs
      const ep: Record<string, string> = {};
      monthlyPhotos.forEach((p, idx) => {
        if (idx === 0) ep[p.id] = 'INSTALACIONES ELÉCTRICAS';
        else if (idx === 1) ep[p.id] = 'INSTALACIÓN PUENTE METÁLICO';
        else if (idx === 2) ep[p.id] = 'TABIQUES DEL 3° PISO';
        else ep[p.id] = p.customTitle || p.itemName.toUpperCase();
      });
      setPhotoEpigraphs(ep);
    }
  }, [monthlyPhotos]);

  // Populate initial work stages from project milestones if available
  useEffect(() => {
    if (project?.milestones && project.milestones.length > 0) {
      const stages: WorkStageRow[] = project.milestones.slice(0, 6).map((m, idx) => ({
        id: m.id || String(idx),
        percentage: m.progressPercentage ?? (m.completed ? 100 : 50),
        label: m.name
      }));
      setWorkStages(stages);
    }
  }, [project?.milestones]);

  // Auto-generate suggested written text
  const handleGenerateSmartSummary = () => {
    if (!project) return;
    const activeMilestones = project.milestones?.filter(m => !m.completed) || [];
    const completedMilestones = project.milestones?.filter(m => m.completed) || [];

    setReportEstructura(
      completedMilestones.length > 0
        ? `Se completaron con éxito las tareas de ${completedMilestones.map(m => m.name).slice(0, 2).join(' y ')}. Avance firme en hormigonado y armadura de estructuras.`
        : 'Ejecución y fraguado de elementos estructurales, losas y tabiques de hormigón armado según planos de cálculo.'
    );

    setReportInstalaciones(
      'Avanzan los tendidos de cañerías embutidas para electricidad, bajadas de desagües cloacales y distribución sanitaria termofusión.'
    );

    setReportAlbanileria(
      'Mampostería de cerramiento, revoques gruesos y finos en frentes e interiores de unidades funcionales y áreas comunes.'
    );

    setReportEstado(
      'La obra continúa a paso firme cumpliendo con las etapas programadas para el período, respetando los estándares de calidad constructiva.'
    );

    setReportProximas(
      activeMilestones.length > 0
        ? `Finalización de ${activeMilestones.map(m => m.name).slice(0, 3).join(', ')}, seguido de inicio de terminaciones y pruebas de instalaciones.`
        : 'Continuidad de tabiques, colado de losas siguientes y montaje de premarcos para aberturas.'
    );
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) callback(res);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Work Stage Rows Management
  const handleAddStageRow = () => {
    const newRow: WorkStageRow = {
      id: `stage_${Date.now()}`,
      percentage: 50,
      label: 'Nueva etapa de avance'
    };
    setWorkStages(prev => [...prev, newRow]);
  };

  const handleUpdateStageRow = (id: string, updates: Partial<WorkStageRow>) => {
    setWorkStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteStageRow = (id: string) => {
    setWorkStages(prev => prev.filter(s => s.id !== id));
  };

  // High-Precision Portrait Print Trigger
  const handlePrint = () => {
    // Inject dynamic style tag to enforce A4 portrait
    const styleEl = document.createElement('style');
    styleEl.id = 'monthly-report-print-style';
    styleEl.innerHTML = `
      @page {
        size: A4 portrait !important;
        margin: 0 !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
    `;
    document.head.appendChild(styleEl);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        const injected = document.getElementById('monthly-report-print-style');
        if (injected) injected.remove();
      }, 1000);
    }, 150);
  };

  if (!isOpen || !project) return null;

  const currentYearStr = String(selectedMonthInfo.year);
  const currentMonthNameUpper = MONTH_NAMES_ES[selectedMonthInfo.monthIndex].toUpperCase();

  // Gallery Photos for Page 2 (ordered up to 4 photos)
  const page2Photos = selectedGalleryPhotoIds
    .map(id => monthlyPhotos.find(p => p.id === id))
    .filter((p): p is MonthlyPhotoItem => !!p);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden animate-in fade-in duration-150 report-modal-backdrop">
      {/* Hidden File Inputs */}
      <input
        ref={devLogoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, (url) => handleSaveDeveloperBranding(url, developerName))}
        className="hidden"
      />
      <input
        ref={projLogoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, handleSaveProjectLogo)}
        className="hidden"
      />
      <input
        ref={heroPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, setHeroPhotoUrl)}
        className="hidden"
      />
      <input
        ref={closingPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, setClosingPhotoUrl)}
        className="hidden"
      />

      {/* TOP CONFIGURATION APP BAR (NO-PRINT) */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 no-print z-30 select-none shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            <FileCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>Informe de Obra Mensual</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                PDF Ejecutivo
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-md">
              {project.name} • {selectedMonthInfo.label}
            </p>
          </div>
        </div>

        {/* Toolbar Center: Month Picker */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-400">Período:</span>
          <select
            value={selectedMonthVal}
            onChange={(e) => setSelectedMonthVal(e.target.value)}
            className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
          >
            {availableMonths.map(m => (
              <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions: Print and Close */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all touch-target"
            title="Generar e imprimir informe en PDF"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Imprimir / Guardar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors touch-target"
            title="Cerrar modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* SUB-HEADER CONFIGURATION TABS (NO-PRINT) */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 no-print text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setActiveConfigTab('preview')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeConfigTab === 'preview'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa del Documento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConfigTab('logos')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeConfigTab === 'logos'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Logos de Empresa y Obra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConfigTab('stages')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeConfigTab === 'stages'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. Portada y Etapa de Obra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConfigTab('text')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeConfigTab === 'text'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>3. Resumen Escrito</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConfigTab('photos')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeConfigTab === 'photos'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>4. Fotos del Mes ({monthlyPhotos.length})</span>
          </button>
        </div>

        {/* Quick hint */}
        <span className="text-[11px] text-slate-400 hidden lg:inline">
          Formato A4 vertical ejecutivo con diseño corporativo
        </span>
      </div>

      {/* DRAWER / CONFIGURATION PANELS (WHEN TABS OTHER THAN PREVIEW ARE ACTIVE) (NO-PRINT) */}
      {activeConfigTab !== 'preview' && (
        <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-6 no-print overflow-y-auto max-h-[45vh] shadow-xl animate-in slide-in-from-top-2">
          {/* TAB 1: LOGOS CONFIGURATION */}
          {activeConfigTab === 'logos' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Configuración de Logos Dinámicos</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Personaliza los dos logos que encabezan y firman el informe mensual. No se utiliza el logo genérico de la aplicación.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Logo 1: Desarrolladora */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                      1. Empresa Desarrolladora
                    </span>
                    <button
                      type="button"
                      onClick={() => devLogoInputRef.current?.click()}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg border border-slate-700 flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3 text-amber-400" />
                      <span>{developerLogo ? 'Cambiar Logo' : 'Subir Logo'}</span>
                    </button>
                  </div>

                  <div className="h-20 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center p-3 relative group">
                    {developerLogo ? (
                      <img src={developerLogo} alt="Logo Desarrolladora" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
                        <Building2 className="w-5 h-5 text-amber-500" />
                        <span>Sin logo de imagen (se usa tipografía institucional)</span>
                      </div>
                    )}
                    {developerLogo && (
                      <button
                        type="button"
                        onClick={() => handleSaveDeveloperBranding('', developerName)}
                        className="absolute top-2 right-2 p-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg transition-colors"
                        title="Quitar logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nombre Comercial / Razón Social
                    </label>
                    <input
                      type="text"
                      value={developerName}
                      onChange={(e) => handleSaveDeveloperBranding(developerLogo, e.target.value)}
                      placeholder="Ej: TIERRA FIRME - DESARROLLOS SÓLIDOS"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Logo 2: Proyecto Inmobiliario */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                      2. Proyecto Inmobiliario (Esta Obra)
                    </span>
                    <button
                      type="button"
                      onClick={() => projLogoInputRef.current?.click()}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg border border-slate-700 flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3 text-amber-400" />
                      <span>{projectLogo ? 'Cambiar Logo' : 'Subir Logo'}</span>
                    </button>
                  </div>

                  <div className="h-20 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center p-3 relative group">
                    {projectLogo ? (
                      <img src={projectLogo} alt="Logo Proyecto" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] tracking-[0.2em] font-bold text-slate-400 uppercase">EDIFICIO</span>
                        <span className="text-sm font-black text-white tracking-wide uppercase">{project.name}</span>
                      </div>
                    )}
                    {projectLogo && (
                      <button
                        type="button"
                        onClick={() => handleSaveProjectLogo('')}
                        className="absolute top-2 right-2 p-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg transition-colors"
                        title="Quitar logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Este logo se almacena de forma independiente para cada obra y se actualiza automáticamente al cambiar de proyecto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COVER & WORK STAGES */}
          {activeConfigTab === 'stages' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Titular Superior de Portada
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Subtítulo / Hito Destacado de Portada
                  </label>
                  <input
                    type="text"
                    value={stageHeadline}
                    onChange={(e) => setStageHeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              {/* Cover Hero Photo selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Foto Principal de Portada (Hero Image)
                  </label>
                  <button
                    type="button"
                    onClick={() => heroPhotoInputRef.current?.click()}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>Subir Foto Específica</span>
                  </button>
                </div>

                {monthlyPhotos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {monthlyPhotos.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setHeroPhotoUrl(p.dataUrl)}
                        className={`w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 cursor-pointer transition-all ${
                          heroPhotoUrl === p.dataUrl ? 'border-amber-500 scale-105 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={p.dataUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Stages Table Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Tabla "Etapa de OBRA" (Porcentajes y Renglones)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStageRow}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] rounded-lg border border-amber-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Renglón</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {workStages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="w-24 shrink-0 flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={stage.percentage}
                          onChange={(e) => handleUpdateStageRow(stage.id, { percentage: Number(e.target.value) })}
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-bold text-center"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                      <input
                        type="text"
                        value={stage.label}
                        onChange={(e) => handleUpdateStageRow(stage.id, { label: e.target.value })}
                        placeholder="Descripción de la etapa o hito..."
                        className="flex-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteStageRow(stage.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Eliminar renglón"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WRITTEN EXECUTIVE REPORT */}
          {activeConfigTab === 'text' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">
                    Redacción del Informe de Obra (Página 3)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Detalle técnico estructurado de las tareas realizadas en el mes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSmartSummary}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sugerir Borrador Automático</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Estructura
                  </label>
                  <textarea
                    rows={2}
                    value={reportEstructura}
                    onChange={(e) => setReportEstructura(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Instalaciones
                  </label>
                  <textarea
                    rows={2}
                    value={reportInstalaciones}
                    onChange={(e) => setReportInstalaciones(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Albañilería y terminaciones
                  </label>
                  <textarea
                    rows={2}
                    value={reportAlbanileria}
                    onChange={(e) => setReportAlbanileria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Estado de situación
                  </label>
                  <textarea
                    rows={2}
                    value={reportEstado}
                    onChange={(e) => setReportEstado(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Próximas tareas
                  </label>
                  <textarea
                    rows={2}
                    value={reportProximas}
                    onChange={(e) => setReportProximas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Closing photo selector */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Foto de Cierre Técnico (Pie de Página 3)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Se muestra bajo el resumen escrito de obra
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => closingPhotoInputRef.current?.click()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg border border-slate-700 flex items-center gap-1"
                >
                  <Upload className="w-3 h-3 text-amber-400" />
                  <span>Subir Foto de Cierre</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: MONTHLY PHOTOS & EPIGRAPHS */}
          {activeConfigTab === 'photos' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">
                    Fotos Registradas en {selectedMonthInfo.label} ({monthlyPhotos.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tildas las fotos que aparecerán en la Página 2 (Galería "Avances del Mes") y personaliza sus epígrafes subrayados.
                  </p>
                </div>
              </div>

              {monthlyPhotos.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800">
                  <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    No se registraron fotos con fecha de {selectedMonthInfo.label} en esta obra.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Puedes cambiar de mes arriba o subir fotos directamente desde los botones de Portada y Cierre.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {monthlyPhotos.map((photo) => {
                    const isSelected = selectedGalleryPhotoIds.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        className={`bg-slate-950 p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected ? 'border-amber-500/80 shadow-md' : 'border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-900 mb-2">
                          <img src={photo.dataUrl} alt="Foto" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGalleryPhotoIds(prev =>
                                isSelected ? prev.filter(id => id !== photo.id) : [...prev, photo.id]
                              );
                            }}
                            className={`absolute top-1.5 right-1.5 p-1 rounded-md text-xs font-black flex items-center gap-1 ${
                              isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/80 text-white border border-slate-700'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{isSelected ? 'Incluida' : 'Incluir'}</span>
                          </button>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Epígrafe Subrayado:
                          </label>
                          <input
                            type="text"
                            value={photoEpigraphs[photo.id] || photo.customTitle || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPhotoEpigraphs(prev => ({ ...prev, [photo.id]: val }));
                            }}
                            placeholder="Ej: INSTALACIÓN ELÉCTRICA..."
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MAIN DOCUMENT SCROLL CONTAINER: LIVE PREVIEW & PRINTABLE SHEETS */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/50 flex flex-col items-center gap-8 report-sheet-wrapper">
        {/* ========================================================================= */}
        {/* PÁGINA 1: PORTADA EJECUTIVA / RESUMEN DE AVANCE (ESTRUCTURA EXACTA A4) */}
        {/* ========================================================================= */}
        <section className="monthly-report-page monthly-report-preview-sheet flex flex-col justify-between font-sans">
          <div className="p-8 sm:p-12 pb-4 flex-1 flex flex-col justify-between">
            {/* 1. Header Top: Tagline Left + Month Right */}
            <div className="flex items-start justify-between gap-4 border-b-2 border-slate-300 pb-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-700 tracking-tight uppercase leading-none">
                  {tagline}
                </h2>
                <h3 className="text-sm sm:text-base font-bold text-slate-500 uppercase mt-1 tracking-wide">
                  {stageHeadline}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-black text-slate-700 tracking-wider uppercase">
                  {currentMonthNameUpper}
                </span>
                <span className="block text-xs font-bold text-slate-400">
                  {currentYearStr}
                </span>
              </div>
            </div>

            {/* 2. Hero Photograph of the Building / Facade */}
            <div className="my-6 flex-1 min-h-[360px] max-h-[460px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center relative">
              {heroPhotoUrl ? (
                <img
                  src={heroPhotoUrl}
                  alt="Avance de Obra"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-8 text-center">
                  <Camera className="w-12 h-12 text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Fotografía Principal de Obra ({currentMonthNameUpper})
                  </p>
                </div>
              )}
            </div>

            {/* 3. Lower Section: Project Logo on Left + "Etapa de OBRA" Table on Right */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end pt-2">
              {/* Project Logo Box */}
              <div className="flex flex-col items-center sm:items-start justify-center p-2">
                {projectLogo ? (
                  <img
                    src={projectLogo}
                    alt={project.name}
                    className="max-h-24 max-w-[260px] object-contain"
                  />
                ) : (
                  <div className="text-center sm:text-left">
                    <span className="text-xs tracking-[0.25em] font-black text-slate-500 uppercase block mb-0.5">
                      EDIFICIO
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                      {project.name}
                    </h1>
                    <div className="flex items-center gap-2 my-1">
                      <div className="h-0.5 bg-slate-400 flex-1" />
                      <span className="text-[11px] italic font-serif text-slate-500">de los</span>
                      <div className="h-0.5 bg-slate-400 flex-1" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-widest uppercase block">
                      ANDES
                    </span>
                  </div>
                )}
              </div>

              {/* "Etapa de OBRA" Table */}
              <div className="overflow-hidden rounded-xl shadow-xs border border-slate-300">
                <div className="bg-slate-600 text-white font-black text-xs sm:text-sm px-4 py-1.5 uppercase tracking-wider text-center">
                  Etapa de OBRA
                </div>
                <div className="divide-y divide-slate-300 bg-slate-500 text-white">
                  {workStages.map((stage) => (
                    <div key={stage.id} className="flex items-center text-xs sm:text-sm font-bold bg-slate-500 hover:bg-slate-600 transition-colors">
                      <span className="w-16 sm:w-20 px-3 py-1.5 bg-slate-600 text-right font-black border-r border-slate-400">
                        {stage.percentage}%
                      </span>
                      <span className="px-3 py-1.5 flex-1 truncate">
                        {stage.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Bottom Solid Corporate Banner: Developer Company Logo & Name */}
          <div className="bg-slate-700 text-white px-8 py-5 flex items-center justify-center shrink-0">
            {developerLogo ? (
              <img
                src={developerLogo}
                alt={developerName}
                className="max-h-14 max-w-[340px] object-contain brightness-0 invert"
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border-2 border-white flex items-center justify-center font-black text-lg">
                  T
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black tracking-wider uppercase leading-none">
                    {developerName.split('-')[0]?.trim() || 'TIERRA FIRME'}
                  </h4>
                  <p className="text-[10px] tracking-[0.3em] font-semibold text-slate-300 uppercase mt-0.5">
                    {developerName.split('-')[1]?.trim() || 'DESARROLLOS SÓLIDOS'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PÁGINA 2: AVANCES DEL MES (GALERÍA FOTOGRÁFICA TÉCNICA) */}
        {/* ========================================================================= */}
        <section className="monthly-report-page monthly-report-preview-sheet flex flex-col justify-between font-sans relative">
          {/* Lateral Right Color Stripe (Matching Reference Accent) */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-slate-500 hidden sm:block" />
          <div className="absolute right-4 top-0 bottom-0 w-1 bg-red-700 hidden sm:block" />

          {/* Top Block Tab Accent */}
          <div className="pt-0 pr-8 sm:pr-12 flex justify-end">
            <div className="bg-slate-500 text-white font-black text-sm sm:text-base px-6 py-3 rounded-b-xl uppercase tracking-wider shadow-md">
              {galleryTabSubtitle}
            </div>
          </div>

          <div className="p-8 sm:p-12 pr-8 sm:pr-16 flex-1 flex flex-col justify-between">
            {/* Photo Sections */}
            <div className="space-y-6 flex-1">
              {page2Photos.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600 uppercase">
                    Galería Fotográfica de Avance
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Selecciona fotos del mes desde la solapa "4. Fotos del Mes" para incluirlas en esta página.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Photo 1: Full Width Top Section */}
                  {page2Photos[0] && (
                    <div>
                      <div className="border-b-2 border-slate-600 pb-1 mb-2">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          {photoEpigraphs[page2Photos[0].id] || 'INSTALACIÓN ELÉCTRICA'}
                        </h4>
                      </div>
                      <div className="aspect-[16/8] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={page2Photos[0].dataUrl}
                          alt="Avance de obra"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Photos 2 & 3: Columns Layout */}
                  {page2Photos.length > 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left Column (Photo 2) */}
                      {page2Photos[1] && (
                        <div>
                          <div className="border-b-2 border-slate-600 pb-1 mb-2">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider truncate">
                              {photoEpigraphs[page2Photos[1].id] || 'INSTALACIÓN PUENTE METÁLICO'}
                            </h4>
                          </div>
                          <div className="aspect-[4/5] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                            <img
                              src={page2Photos[1].dataUrl}
                              alt="Avance de obra"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Right Column (Photo 3 & optional 4) */}
                      {page2Photos[2] && (
                        <div className="space-y-4">
                          <div>
                            <div className="border-b-2 border-slate-600 pb-1 mb-2">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider truncate">
                                {photoEpigraphs[page2Photos[2].id] || 'TABIQUES DEL 3° PISO'}
                              </h4>
                            </div>
                            <div className="aspect-[16/10] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                              <img
                                src={page2Photos[2].dataUrl}
                                alt="Avance de obra"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          {page2Photos[3] && (
                            <div className="aspect-[16/10] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                              <img
                                src={page2Photos[3].dataUrl}
                                alt="Avance de obra"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Page 2 Footer: Dual Logos */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
              {/* Project Logo Left */}
              <div>
                {projectLogo ? (
                  <img src={projectLogo} alt="Proyecto" className="max-h-12 max-w-[180px] object-contain" />
                ) : (
                  <div>
                    <span className="text-[9px] tracking-widest text-slate-400 uppercase font-bold block">EDIFICIO</span>
                    <span className="text-sm font-black text-slate-800 uppercase">{project.name}</span>
                  </div>
                )}
              </div>

              {/* Developer Logo Right */}
              <div>
                {developerLogo ? (
                  <img src={developerLogo} alt="Desarrolladora" className="max-h-12 max-w-[180px] object-contain" />
                ) : (
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      {developerName.split('-')[0]?.trim() || 'TIERRA FIRME'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                      {developerName.split('-')[1]?.trim() || 'DESARROLLOS SÓLIDOS'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PÁGINA 3: INFORME ESCRITO Y SÍNTESIS TÉCNICA */}
        {/* ========================================================================= */}
        <section className="monthly-report-page monthly-report-preview-sheet flex flex-col justify-between font-sans relative">
          {/* Lateral Right Color Stripe */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-slate-500 hidden sm:block" />
          <div className="absolute right-4 top-0 bottom-0 w-1 bg-red-700 hidden sm:block" />

          {/* Top Block Tab Accent */}
          <div className="pt-0 pr-8 sm:pr-12 flex justify-end">
            <div className="bg-slate-500 text-white font-black text-sm sm:text-base px-6 py-3 rounded-b-xl uppercase tracking-wider shadow-md">
              {textTabSubtitle}
            </div>
          </div>

          <div className="p-8 sm:p-12 pr-8 sm:pr-16 flex-1 flex flex-col justify-between">
            {/* Written Report Body */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
              <div className="border-b-2 border-slate-300 pb-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                  INFORME DE OBRA
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 mt-1">
                  <span>Obra: {project.name}</span>
                  <span>•</span>
                  <span>Fecha: {selectedMonthInfo.label}</span>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs mb-1">
                  Avance de obra
                </h4>
                <p className="text-slate-600 italic mb-2">
                  Durante el presente período se han ejecutado las siguientes tareas principales:
                </p>

                <div className="space-y-2.5 pl-1">
                  <div>
                    <span className="font-black text-slate-900">Estructura: </span>
                    <span className="text-slate-700">{reportEstructura}</span>
                  </div>

                  <div>
                    <span className="font-black text-slate-900">Instalaciones: </span>
                    <span className="text-slate-700">{reportInstalaciones}</span>
                  </div>

                  <div>
                    <span className="font-black text-slate-900">Albañilería y terminaciones: </span>
                    <span className="text-slate-700">{reportAlbanileria}</span>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs mb-1">
                  Estado de situación
                </h4>
                <p className="text-slate-700">{reportEstado}</p>
              </div>

              <div className="pt-1">
                <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs mb-1">
                  Próximas tareas
                </h4>
                <p className="text-slate-700">{reportProximas}</p>
              </div>
            </div>

            {/* Closing Photograph */}
            <div className="my-4 aspect-[16/8] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              {closingPhotoUrl ? (
                <img
                  src={closingPhotoUrl}
                  alt="Avance de obra"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-bold uppercase">
                  <Camera className="w-8 h-8 text-slate-300 mb-1" />
                  <span>Fotografía de Cierre de Avance</span>
                </div>
              )}
            </div>

            {/* Page 3 Footer: Developer Logo & Signatory Block */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                {developerLogo ? (
                  <img src={developerLogo} alt="Desarrolladora" className="max-h-12 max-w-[200px] object-contain" />
                ) : (
                  <div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-wider block">
                      {developerName.split('-')[0]?.trim() || 'TIERRA FIRME'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      {developerName.split('-')[1]?.trim() || 'DESARROLLOS SÓLIDOS'}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-slate-900 block">
                  {project.director || 'Dirección de Obra'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Supervisión y Control de Avance Técnico
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
