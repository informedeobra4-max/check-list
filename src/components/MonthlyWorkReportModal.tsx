import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Camera,
  RotateCcw,
  Pencil,
  Check,
  Upload,
  Layers,
  Sparkles,
  Building2,
  FileCheck,
  Eye,
  Sliders
} from 'lucide-react';
import { Project } from '../types';

interface MonthlyWorkReportModalProps {
  isOpen: boolean;
  project: Project | null;
  headerLogoUrl?: string;
  onClose: () => void;
  onUpdateProject?: (updatedProject: Project) => void;
}

type TemplateType = 'parque_agustin' | 'parque_andes';

// -------------------------------------------------------------
// DEFAULT DATA FOR PARQUE AGUSTÍN (2 PÁGINAS)
// -------------------------------------------------------------
interface AgustinData {
  year: string;
  tagline: string;
  month: string;
  bubble1Percent: string;
  bubble1Text: string;
  bubble2Percent: string;
  bubble2Text: string;
  bubble3Percent: string;
  bubble3Text: string;
  p1Facade1Photo: string;
  p1Facade2Photo: string;
  p1Item1Num: string;
  p1Item1Title: string;
  p1Item1Photo: string;
  p1Item2Num: string;
  p1Item2Title: string;
  p1Item2Photo: string;
  p1Item3Num: string;
  p1Item3Title: string;
  p1Item3Photo: string;

  // Page 2
  p2ResumenText: string;
  p2Photo1: string;
  p2Photo2: string;
  p2Photo3: string;
  p2Item4Num: string;
  p2Item4Title: string;
  p2Item4Photo: string;
  p2Item5Num: string;
  p2Item5Title: string;
  p2Item5Photo: string;
  p2Item6Num: string;
  p2Item6Title: string;
  p2Item6Photo: string;
  p2Item7Num: string;
  p2Item7Title: string;
  p2Item7Photo: string;
}

const DEFAULT_AGUSTIN_DATA: AgustinData = {
  year: '2026',
  tagline: 'VA TOMANDO COLOR!!',
  month: 'MAYO',
  bubble1Percent: '98 %',
  bubble1Text: 'YESO HASTA EL 7 PISOS',
  bubble2Percent: '80 %',
  bubble2Text: 'INSTALACIONES COMPLETAS',
  bubble3Percent: '25 %',
  bubble3Text: 'ABERTURAS DE ALUMINIO DVH',
  p1Facade1Photo: '/report_assets/defaults/agustin_p1_facade_1.png',
  p1Facade2Photo: '/report_assets/defaults/agustin_p1_facade_2.png',
  p1Item1Num: '01',
  p1Item1Title: 'Mueble de cocinas 1° piso',
  p1Item1Photo: '/report_assets/defaults/agustin_p1_item_01.png',
  p1Item2Num: '02',
  p1Item2Title: 'Carpinteria vamos por el 2° piso',
  p1Item2Photo: '/report_assets/defaults/agustin_p1_item_02.png',
  p1Item3Num: '03',
  p1Item3Title: 'Porcelanato en Quincho + piscina',
  p1Item3Photo: '/report_assets/defaults/agustin_p1_item_03.png',

  // Page 2
  p2ResumenText: `La obra continúa avanzando de manera sostenida y conforme a la planificación establecida. Los trabajos de yesería se encuentran completados hasta el 7° piso, mientras que los revestimientos de baños y cocinas presentan un avance aproximado del 80 % en dicho nivel.

Se continúa con la colocación de porcelanato en balcones y la instalación de barandas metálicas, alcanzando actualmente un avance del 65 %, con tareas en ejecución.

En cuanto a las carpinterías exteriores, se inició la colocación de aberturas de aluminio con doble vidriado hermético (DVH), encontrándose completada la instalación hasta el 2° piso. A partir del 13 de julio se prevé continuar con los niveles superiores, avanzando progresivamente hasta la finalización total del edificio.

Asimismo, se dio inicio a la fabricación de mobiliario fijo, incluyendo muebles de cocina y frentes de placard, encontrándose actualmente en proceso de equipamiento una unidad del primer piso.

Respecto de las terminaciones exteriores, se completó el texturado de las fachadas laterales y actualmente se trabaja sobre la fachada principal, para posteriormente continuar con la fachada posterior.

En el sector quincho y piscina se están ejecutando los revestimientos, y durante las próximas semanas se iniciarán los trabajos de yesería en dicho sector.

Por otra parte, comenzaron las tareas de ejecución de carpetas en los estacionamientos, lo que implica la finalización de la totalidad de las instalaciones y trabajos subterráneos.

La obra mantiene un ritmo de avance firme y sostenido, ingresando progresivamente en las etapas finales de terminaciones y equipamiento.`,
  p2Photo1: '/report_assets/defaults/agustin_p2_photo_1.png',
  p2Photo2: '/report_assets/defaults/agustin_p2_photo_2.png',
  p2Photo3: '/report_assets/defaults/agustin_p2_photo_3.png',
  p2Item4Num: '04',
  p2Item4Title: 'Contrapisos en cocheras',
  p2Item4Photo: '/report_assets/defaults/agustin_p2_item_04.png',
  p2Item5Num: '05',
  p2Item5Title: 'Puertas principal 1° piso',
  p2Item5Photo: '/report_assets/defaults/agustin_p2_item_05.png',
  p2Item6Num: '06',
  p2Item6Title: 'Puertas internas 1° piso',
  p2Item6Photo: '/report_assets/defaults/agustin_p2_item_06.png',
  p2Item7Num: '06',
  p2Item7Title: 'Revestimiento de baños y cocinas hasta el 7° piso',
  p2Item7Photo: '/report_assets/defaults/agustin_p2_item_07.png'
};

// -------------------------------------------------------------
// DEFAULT DATA FOR PARQUE DE LOS ANDES (3 PÁGINAS)
// -------------------------------------------------------------
interface AndesData {
  p1TopLeftTitle: string;
  p1TopRightDate: string;
  p1Subtitle: string;
  p1Photo1: string;
  p1Photo2: string;
  p1Stage1Pct: string;
  p1Stage1Label: string;
  p1Stage2Pct: string;
  p1Stage2Label: string;
  p1Stage3Pct: string;
  p1Stage3Label: string;
  p1Stage4Pct: string;
  p1Stage4Label: string;

  // Page 2
  p2TabTitle: string;
  p2Subtitle: string;
  p2Photo1Title1: string;
  p2Photo1Title2: string;
  p2Photo1: string;
  p2Photo2Title1: string;
  p2Photo2Title2: string;
  p2Photo2: string;
  p2Photo3Title: string;
  p2Photo3: string;
  p2Photo4Title: string;
  p2Photo4: string;

  // Page 3
  p3TabTitle: string;
  p3DocTitle: string;
  p3Paragraph1: string;
  p3Paragraph2: string;
  p3Paragraph3: string;
  p3Paragraph4: string;
  p3Subheading: string;
  p3NextTasksIntro: string;
  p3NextTasksList: string;
  p3Conclusion: string;
}

const DEFAULT_ANDES_DATA: AndesData = {
  p1TopLeftTitle: '2026 RECUADROS EXTERIORES',
  p1TopRightDate: 'JULIO 2026',
  p1Subtitle: 'GRAN AVANCE EN SUS 4 FACHADAS',
  p1Photo1: '/report_assets/defaults/andes_p1_photo_1.png',
  p1Photo2: '/report_assets/defaults/andes_p1_photo_2.png',
  p1Stage1Pct: '100%',
  p1Stage1Label: 'CUBIERTA 4 PISO',
  p1Stage2Pct: '100%',
  p1Stage2Label: 'TABIQUE 5° TANQUE DE RESERVA',
  p1Stage3Pct: '50%',
  p1Stage3Label: 'PANELES EN DEPTOS',
  p1Stage4Pct: '50%',
  p1Stage4Label: 'INSTALACION SANITARIA Y ELECTRICA',

  // Page 2
  p2TabTitle: 'FACHADAS',
  p2Subtitle: 'Terminaciones exteriores',
  p2Photo1Title1: 'Revoque fachadas internas',
  p2Photo1Title2: 'Instalacion sanitaria',
  p2Photo1: '/report_assets/defaults/andes_p2_photo_1.png',
  p2Photo2Title1: 'Recuadros barandas balcón',
  p2Photo2Title2: 'Instalacion sanitaria',
  p2Photo2: '/report_assets/defaults/andes_p2_photo_2.png',
  p2Photo3Title: 'Instalacion sanitaria',
  p2Photo3: '/report_assets/defaults/andes_p2_photo_3.png',
  p2Photo4Title: 'Cubierta 4° piso',
  p2Photo4: '/report_assets/defaults/andes_p2_photo_4.png',

  // Page 3
  p3TabTitle: 'INFORME',
  p3DocTitle: 'Informe de Avance de Obra – Parque Los Andes',
  p3Paragraph1: 'Durante el período informado, la obra mantuvo un ritmo sostenido de ejecución, concentrando los esfuerzos en tareas correspondientes a la envolvente exterior y en el avance de las instalaciones de los sectores de servicios.',
  p3Paragraph2: 'Se trabajó intensamente en la ejecución de los revoques exteriores de las cuatro fachadas del edificio, realizando las intervenciones necesarias incluso desde propiedades linderas, en coordinación con los vecinos, lo que permitió dar continuidad a los trabajos de terminación de la envolvente y mejorar significativamente el grado de avance de la imagen exterior del proyecto.',
  p3Paragraph3: 'En forma paralela, se avanzó en los depósitos internos, ejecutando las instalaciones sanitarias y eléctricas, dejando estos espacios preparados para las etapas posteriores de terminación.',
  p3Paragraph4: 'En el sector de cubierta, se completaron los trabajos correspondientes al área de los tanques de cisterna, finalizando las tareas previstas para este frente de obra y consolidando un importante hito dentro de la infraestructura general del edificio.',
  p3Subheading: 'Trabajos a continuar',
  p3NextTasksIntro: 'Durante el próximo período se prevé continuar con:',
  p3NextTasksList: `• Ejecución y terminación de los revoques exteriores en las distintas fachadas hasta su completa finalización.
• Avance en la materialización de las divisiones interiores de los departamentos correspondientes al 3.º y 4.º piso, permitiendo consolidar la distribución definitiva de las unidades y dar continuidad a las instalaciones y terminaciones posteriores.`,
  p3Conclusion: 'En términos generales, la obra mantiene una evolución acorde a la planificación establecida, consolidando avances significativos tanto en la envolvente del edificio como en la infraestructura de los sectores técnicos, permitiendo preparar los próximos frentes de trabajo para las etapas de mampostería interior y terminaciones.'
};

export function MonthlyWorkReportModal({
  isOpen,
  project,
  onClose
}: MonthlyWorkReportModalProps) {
  // Determine template based on project name
  const detectedTemplate: TemplateType = (() => {
    const name = (project?.name || '').toLowerCase();
    if (name.includes('agustin') || name.includes('alvarez') || name.includes('quinta')) {
      return 'parque_agustin';
    }
    if (name.includes('andes') || name.includes('paso')) {
      return 'parque_andes';
    }
    return 'parque_agustin';
  })();

  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(detectedTemplate);

  // Sync detected template when project changes
  useEffect(() => {
    setActiveTemplate(detectedTemplate);
  }, [detectedTemplate]);

  // Storage keys for persistence per project
  const storageKeyAgustin = project ? `CONTROL_AVANCE_REPORT_AGUSTIN_${project.id}` : 'CONTROL_AVANCE_REPORT_AGUSTIN';
  const storageKeyAndes = project ? `CONTROL_AVANCE_REPORT_ANDES_${project.id}` : 'CONTROL_AVANCE_REPORT_ANDES';

  // State for Parque Agustín
  const [agustinData, setAgustinData] = useState<AgustinData>(() => {
    try {
      const saved = localStorage.getItem(storageKeyAgustin);
      if (saved) return { ...DEFAULT_AGUSTIN_DATA, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_AGUSTIN_DATA;
  });

  // State for Parque de los Andes
  const [andesData, setAndesData] = useState<AndesData>(() => {
    try {
      const saved = localStorage.getItem(storageKeyAndes);
      if (saved) return { ...DEFAULT_ANDES_DATA, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_ANDES_DATA;
  });

  // Save changes to localStorage
  const updateAgustinData = (updates: Partial<AgustinData>) => {
    setAgustinData(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(storageKeyAgustin, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const updateAndesData = (updates: Partial<AndesData>) => {
    setAndesData(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(storageKeyAndes, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Reset to original PDF default template
  const handleResetTemplate = () => {
    if (activeTemplate === 'parque_agustin') {
      setAgustinData(DEFAULT_AGUSTIN_DATA);
      try { localStorage.removeItem(storageKeyAgustin); } catch {}
    } else {
      setAndesData(DEFAULT_ANDES_DATA);
      try { localStorage.removeItem(storageKeyAndes); } catch {}
    }
  };

  // Generic File Upload Trigger
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<string | null>(null);

  const triggerUpload = (targetKey: string) => {
    setActiveUploadTarget(targetKey);
    fileInputRef.current?.click();
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTarget) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      if (activeTemplate === 'parque_agustin') {
        updateAgustinData({ [activeUploadTarget]: base64 });
      } else {
        updateAndesData({ [activeUploadTarget]: base64 });
      }
      setActiveUploadTarget(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Print Handler (Strict Portrait A4)
  const handlePrint = () => {
    const styleEl = document.createElement('style');
    styleEl.id = 'report-print-enforce';
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
        const el = document.getElementById('report-print-enforce');
        if (el) el.remove();
      }, 1000);
    }, 150);
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden animate-in fade-in duration-150 report-modal-backdrop">
      {/* Hidden File Input for Image Slots */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFilePicked}
        className="hidden"
      />

      {/* TOP CONFIGURATION APP BAR (NO-PRINT) */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 no-print z-30 select-none shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
            <FileCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>Plantilla de Informe de Obra</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                Logos Oficiales Protegidos
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-md">
              {project.name}
            </p>
          </div>
        </div>

        {/* Center: Template Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTemplate('parque_agustin')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTemplate === 'parque_agustin'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Parque Agustín (2 Págs)
          </button>
          <button
            type="button"
            onClick={() => setActiveTemplate('parque_andes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTemplate === 'parque_andes'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Parque de los Andes (3 Págs)
          </button>
        </div>

        {/* Actions: Reset, Print and Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetTemplate}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Restablecer textos e imágenes a la plantilla original"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Restablecer Original</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all touch-target"
            title="Imprimir o guardar en PDF"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Imprimir / PDF</span>
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

      {/* HELPER SUB-BAR (NO-PRINT) */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-300 no-print">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>
            <b>Edición Directa:</b> Haz clic en cualquier imagen para cambiarla/subirla y en los campos de texto para redactar el informe del mes.
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Formato A4 vertical idéntico al PDF oficial
        </span>
      </div>

      {/* MAIN SCROLL CONTAINER: RENDER TEMPLATE */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/60 flex flex-col items-center gap-10 report-sheet-wrapper">
        {/* ========================================================================= */}
        {/* 1. PLANTILLA PARQUE AGUSTÍN (2 PÁGINAS A4 VERTICALES)                     */}
        {/* ========================================================================= */}
        {activeTemplate === 'parque_agustin' && (
          <>
            {/* PÁGINA 1: PARQUE AGUSTÍN */}
            <section className="monthly-report-page monthly-report-preview-sheet flex flex-col justify-between font-sans text-slate-900 bg-white shadow-2xl relative select-text">
              <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between">
                {/* Upper Grid: Left Dark Petrol Card + Right Facade Photos */}
                <div className="grid grid-cols-12 gap-5 items-stretch min-h-[460px]">
                  {/* Left Column Dark Petrol Card */}
                  <div className="col-span-5 bg-[#0a222e] text-white rounded-none p-5 sm:p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
                    <div className="space-y-4">
                      {/* Year & Tagline */}
                      <div>
                        <input
                          type="text"
                          value={agustinData.year}
                          onChange={(e) => updateAgustinData({ year: e.target.value })}
                          className="bg-transparent text-xs font-bold text-slate-400 tracking-wider focus:outline-none w-20"
                        />
                        <input
                          type="text"
                          value={agustinData.tagline}
                          onChange={(e) => updateAgustinData({ tagline: e.target.value })}
                          className="bg-transparent text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wide block w-full focus:outline-none mt-0.5"
                        />
                      </div>

                      {/* Month Big Title */}
                      <div className="pt-2">
                        <input
                          type="text"
                          value={agustinData.month}
                          onChange={(e) => updateAgustinData({ month: e.target.value.toUpperCase() })}
                          className="bg-transparent text-3xl sm:text-4xl font-black text-white tracking-wider uppercase w-full focus:outline-none leading-none border-b-2 border-cyan-400/80 pb-2"
                        />
                      </div>

                      {/* 3 Circular Cyan Progress Badges */}
                      <div className="space-y-4 pt-3">
                        {/* Bubble 1 */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#0091cb] flex items-center justify-center shrink-0 shadow-md">
                            <input
                              type="text"
                              value={agustinData.bubble1Percent}
                              onChange={(e) => updateAgustinData({ bubble1Percent: e.target.value })}
                              className="bg-transparent text-white font-black text-xs text-center w-full focus:outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={agustinData.bubble1Text}
                              onChange={(e) => updateAgustinData({ bubble1Text: e.target.value })}
                              className="bg-transparent text-[11px] font-bold text-slate-200 uppercase tracking-wide w-full focus:outline-none leading-tight"
                            />
                            <div className="h-1 bg-cyan-400 mt-1 w-full rounded-full" />
                          </div>
                        </div>

                        {/* Bubble 2 */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#0091cb] flex items-center justify-center shrink-0 shadow-md">
                            <input
                              type="text"
                              value={agustinData.bubble2Percent}
                              onChange={(e) => updateAgustinData({ bubble2Percent: e.target.value })}
                              className="bg-transparent text-white font-black text-xs text-center w-full focus:outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={agustinData.bubble2Text}
                              onChange={(e) => updateAgustinData({ bubble2Text: e.target.value })}
                              className="bg-transparent text-[11px] font-bold text-slate-200 uppercase tracking-wide w-full focus:outline-none leading-tight"
                            />
                            <div className="h-1 bg-cyan-400 mt-1 w-full rounded-full" />
                          </div>
                        </div>

                        {/* Bubble 3 */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#0091cb] flex items-center justify-center shrink-0 shadow-md">
                            <input
                              type="text"
                              value={agustinData.bubble3Percent}
                              onChange={(e) => updateAgustinData({ bubble3Percent: e.target.value })}
                              className="bg-transparent text-white font-black text-xs text-center w-full focus:outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={agustinData.bubble3Text}
                              onChange={(e) => updateAgustinData({ bubble3Text: e.target.value })}
                              className="bg-transparent text-[11px] font-bold text-slate-200 uppercase tracking-wide w-full focus:outline-none leading-tight"
                            />
                            <div className="h-1 bg-cyan-400 mt-1 w-full rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Official White Tierra Firme Logo (Protected Brand) */}
                    <div className="pt-6 border-t border-slate-700/60 mt-4 flex items-center justify-center">
                      <img
                        src="/report_assets/logo_tierrafirme_white.png"
                        alt="Tierra Firme"
                        className="max-h-11 max-w-[200px] object-contain"
                      />
                    </div>
                  </div>

                  {/* Right Upper Area: 2 Facade Photos Side-by-Side */}
                  <div className="col-span-7 grid grid-cols-2 gap-3 items-stretch">
                    {/* Facade Photo 1 */}
                    <div
                      onClick={() => triggerUpload('p1Facade1Photo')}
                      className="group relative bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-sm"
                      title="Haz clic para subir o cambiar foto"
                    >
                      <img
                        src={agustinData.p1Facade1Photo}
                        alt="Fachada 1"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="px-3 py-1.5 bg-slate-900/90 text-cyan-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cambiar Foto</span>
                        </span>
                      </div>
                    </div>

                    {/* Facade Photo 2 */}
                    <div
                      onClick={() => triggerUpload('p1Facade2Photo')}
                      className="group relative bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-sm"
                      title="Haz clic para subir o cambiar foto"
                    >
                      <img
                        src={agustinData.p1Facade2Photo}
                        alt="Fachada 2"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="px-3 py-1.5 bg-slate-900/90 text-cyan-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cambiar Foto</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower Section: 3 Numbered Columns (01, 02, 03) */}
                <div className="grid grid-cols-3 gap-5 mt-6 pt-2">
                  {/* Item 01 */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0091cb] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        <input
                          type="text"
                          value={agustinData.p1Item1Num}
                          onChange={(e) => updateAgustinData({ p1Item1Num: e.target.value })}
                          className="bg-transparent text-center w-full focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={agustinData.p1Item1Title}
                        onChange={(e) => updateAgustinData({ p1Item1Title: e.target.value })}
                        className="text-xs sm:text-sm font-bold text-slate-800 focus:outline-none w-full border-b border-transparent hover:border-slate-300 focus:border-cyan-500 leading-tight"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p1Item1Photo')}
                      className="group relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img
                        src={agustinData.p1Item1Photo}
                        alt="Item 01"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="px-2.5 py-1 bg-slate-900/90 text-cyan-300 text-xs font-bold rounded-md flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Cambiar</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Item 02 */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0091cb] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        <input
                          type="text"
                          value={agustinData.p1Item2Num}
                          onChange={(e) => updateAgustinData({ p1Item2Num: e.target.value })}
                          className="bg-transparent text-center w-full focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={agustinData.p1Item2Title}
                        onChange={(e) => updateAgustinData({ p1Item2Title: e.target.value })}
                        className="text-xs sm:text-sm font-bold text-slate-800 focus:outline-none w-full border-b border-transparent hover:border-slate-300 focus:border-cyan-500 leading-tight"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p1Item2Photo')}
                      className="group relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img
                        src={agustinData.p1Item2Photo}
                        alt="Item 02"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="px-2.5 py-1 bg-slate-900/90 text-cyan-300 text-xs font-bold rounded-md flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Cambiar</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Item 03 */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0091cb] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        <input
                          type="text"
                          value={agustinData.p1Item3Num}
                          onChange={(e) => updateAgustinData({ p1Item3Num: e.target.value })}
                          className="bg-transparent text-center w-full focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={agustinData.p1Item3Title}
                        onChange={(e) => updateAgustinData({ p1Item3Title: e.target.value })}
                        className="text-xs sm:text-sm font-bold text-slate-800 focus:outline-none w-full border-b border-transparent hover:border-slate-300 focus:border-cyan-500 leading-tight"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p1Item3Photo')}
                      className="group relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img
                        src={agustinData.p1Item3Photo}
                        alt="Item 03"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="px-2.5 py-1 bg-slate-900/90 text-cyan-300 text-xs font-bold rounded-md flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Cambiar</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Official Bar: EN RESUMEN */}
              <div className="px-8 sm:px-10 pb-5 pt-2">
                <img
                  src="/report_assets/bar_en_resumen.png"
                  alt="En Resumen"
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>
            </section>

            {/* PÁGINA 2: PARQUE AGUSTÍN */}
            <section className="monthly-report-page monthly-report-preview-sheet flex flex-col justify-between font-sans text-slate-900 bg-white shadow-2xl relative select-text">
              <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between">
                {/* Upper Grid: Left Written Card with Logos + Right 3 Photos */}
                <div className="grid grid-cols-12 gap-5 items-stretch min-h-[460px]">
                  {/* Left Column Dark Petrol Card (RESUMEN + LOGOS) */}
                  <div className="col-span-6 bg-[#0a222e] text-white p-6 flex flex-col justify-between shadow-md">
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-cyan-400/40 pb-1">
                        RESUMEN
                      </h3>
                      <textarea
                        rows={16}
                        value={agustinData.p2ResumenText}
                        onChange={(e) => updateAgustinData({ p2ResumenText: e.target.value })}
                        className="w-full bg-transparent text-[10.5px] leading-relaxed text-slate-200 focus:outline-none resize-none scrollbar-thin"
                      />
                    </div>

                    {/* Both Official Logos at bottom of Card */}
                    <div className="pt-4 border-t border-slate-700/80 mt-2 flex items-center justify-between gap-4">
                      {/* Logo Parque Agustín (Official) */}
                      <img
                        src="/report_assets/logo_parque_agustin.png"
                        alt="Parque Agustín"
                        className="max-h-10 max-w-[140px] object-contain brightness-0 invert"
                      />
                      {/* Logo Tierra Firme (Official) */}
                      <img
                        src="/report_assets/logo_tierrafirme_white.png"
                        alt="Tierra Firme"
                        className="max-h-9 max-w-[140px] object-contain"
                      />
                    </div>
                  </div>

                  {/* Right Upper Area: 3 Photos Grid */}
                  <div className="col-span-6 grid grid-cols-2 gap-3 items-stretch">
                    {/* Photo 1 (Vertical) */}
                    <div
                      onClick={() => triggerUpload('p2Photo1')}
                      className="group relative bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img
                        src={agustinData.p2Photo1}
                        alt="Foto 1"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="px-2.5 py-1 bg-slate-900/90 text-cyan-300 text-xs font-bold rounded-md flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Cambiar</span>
                        </span>
                      </div>
                    </div>

                    {/* Photo 2 (Angle Facade) */}
                    <div
                      onClick={() => triggerUpload('p2Photo2')}
                      className="group relative bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img
                        src={agustinData.p2Photo2}
                        alt="Foto 2"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="px-2.5 py-1 bg-slate-900/90 text-cyan-300 text-xs font-bold rounded-md flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Cambiar</span>
                        </span>
                      </div>
                    </div>

                    {/* Photo 3 (Full width across two cols) */}
                    <div
                      onClick={() => triggerUpload('p2Photo3')}
                      className="col-span-2 group relative aspect-[16/7] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img
                        src={agustinData.p2Photo3}
                        alt="Foto 3"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="px-2.5 py-1 bg-slate-900/90 text-cyan-300 text-xs font-bold rounded-md flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Cambiar</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower Section: 4 Numbered Columns (04, 05, 06, 06/07) */}
                <div className="grid grid-cols-4 gap-4 mt-6 pt-2">
                  {/* Item 04 */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0091cb] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        <input
                          type="text"
                          value={agustinData.p2Item4Num}
                          onChange={(e) => updateAgustinData({ p2Item4Num: e.target.value })}
                          className="bg-transparent text-center w-full focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={agustinData.p2Item4Title}
                        onChange={(e) => updateAgustinData({ p2Item4Title: e.target.value })}
                        className="text-[11px] font-bold text-slate-800 focus:outline-none w-full leading-tight"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p2Item4Photo')}
                      className="group relative aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img src={agustinData.p2Item4Photo} alt="Item 04" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="p-1 bg-slate-900/90 text-cyan-300 rounded text-[10px] font-bold">Cambiar</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 05 */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0091cb] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        <input
                          type="text"
                          value={agustinData.p2Item5Num}
                          onChange={(e) => updateAgustinData({ p2Item5Num: e.target.value })}
                          className="bg-transparent text-center w-full focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={agustinData.p2Item5Title}
                        onChange={(e) => updateAgustinData({ p2Item5Title: e.target.value })}
                        className="text-[11px] font-bold text-slate-800 focus:outline-none w-full leading-tight"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p2Item5Photo')}
                      className="group relative aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img src={agustinData.p2Item5Photo} alt="Item 05" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="p-1 bg-slate-900/90 text-cyan-300 rounded text-[10px] font-bold">Cambiar</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 06 */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0091cb] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        <input
                          type="text"
                          value={agustinData.p2Item6Num}
                          onChange={(e) => updateAgustinData({ p2Item6Num: e.target.value })}
                          className="bg-transparent text-center w-full focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={agustinData.p2Item6Title}
                        onChange={(e) => updateAgustinData({ p2Item6Title: e.target.value })}
                        className="text-[11px] font-bold text-slate-800 focus:outline-none w-full leading-tight"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p2Item6Photo')}
                      className="group relative aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img src={agustinData.p2Item6Photo} alt="Item 06" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="p-1 bg-slate-900/90 text-cyan-300 rounded text-[10px] font-bold">Cambiar</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 07 */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0091cb] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        <input
                          type="text"
                          value={agustinData.p2Item7Num}
                          onChange={(e) => updateAgustinData({ p2Item7Num: e.target.value })}
                          className="bg-transparent text-center w-full focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={agustinData.p2Item7Title}
                        onChange={(e) => updateAgustinData({ p2Item7Title: e.target.value })}
                        className="text-[11px] font-bold text-slate-800 focus:outline-none w-full leading-tight"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p2Item7Photo')}
                      className="group relative aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs"
                    >
                      <img src={agustinData.p2Item7Photo} alt="Item 07" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="p-1 bg-slate-900/90 text-cyan-300 rounded text-[10px] font-bold">Cambiar</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Official Bar: EN RESUMEN */}
              <div className="px-8 sm:px-10 pb-5 pt-2">
                <img
                  src="/report_assets/bar_en_resumen.png"
                  alt="En Resumen"
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>
            </section>
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. PLANTILLA PARQUE DE LOS ANDES (3 PÁGINAS A4 VERTICALES)                */}
        {/* ========================================================================= */}
        {activeTemplate === 'parque_andes' && (
          <>
            {/* PÁGINA 1: PARQUE DE LOS ANDES (PORTADA) */}
            <section className="monthly-report-page monthly-report-preview-sheet flex flex-col justify-between font-sans text-slate-900 bg-white shadow-2xl relative select-text">
              {/* Top Gray Bar */}
              <div className="bg-[#777c80] text-white px-8 sm:px-10 py-3 flex items-center justify-between shrink-0">
                <input
                  type="text"
                  value={andesData.p1TopLeftTitle}
                  onChange={(e) => updateAndesData({ p1TopLeftTitle: e.target.value })}
                  className="bg-transparent text-sm sm:text-base font-bold tracking-wide uppercase focus:outline-none w-1/2"
                />
                <input
                  type="text"
                  value={andesData.p1TopRightDate}
                  onChange={(e) => updateAndesData({ p1TopRightDate: e.target.value })}
                  className="bg-transparent text-sm sm:text-base font-bold tracking-wider text-right uppercase focus:outline-none w-1/3"
                />
              </div>

              <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between">
                {/* Subtitle */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={andesData.p1Subtitle}
                    onChange={(e) => updateAndesData({ p1Subtitle: e.target.value })}
                    className="text-base sm:text-lg font-black text-slate-700 uppercase tracking-wide w-full focus:outline-none"
                  />
                </div>

                {/* 2 Large Facade Photos Side-by-Side */}
                <div className="grid grid-cols-2 gap-4 flex-1 min-h-[380px] my-2">
                  <div
                    onClick={() => triggerUpload('p1Photo1')}
                    className="group relative bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200"
                  >
                    <img src={andesData.p1Photo1} alt="Fachada 1" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                      <span className="px-3 py-1.5 bg-slate-900/90 text-amber-300 text-xs font-bold rounded-lg flex items-center gap-1 shadow-md">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cambiar Foto</span>
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => triggerUpload('p1Photo2')}
                    className="group relative bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200"
                  >
                    <img src={andesData.p1Photo2} alt="Fachada 2" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                      <span className="px-3 py-1.5 bg-slate-900/90 text-amber-300 text-xs font-bold rounded-lg flex items-center gap-1 shadow-md">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cambiar Foto</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lower Section: Official Andes Logo (Left) + "Etapa de OBRA" Table (Right) */}
                <div className="grid grid-cols-12 gap-6 items-end pt-4">
                  {/* Left: Official Parque de los Andes Logo */}
                  <div className="col-span-5 flex items-center justify-center p-2">
                    <img
                      src="/report_assets/logo_parque_de_los_andes.png"
                      alt="Edificio Parque de los Andes"
                      className="max-h-24 max-w-[220px] object-contain"
                    />
                  </div>

                  {/* Right: Etapa de OBRA Table */}
                  <div className="col-span-7 overflow-hidden rounded-none border border-slate-400">
                    <div className="bg-[#777c80] text-white font-black text-sm px-4 py-1.5 uppercase tracking-wider text-center">
                      Etapa de OBRA
                    </div>
                    <div className="divide-y divide-slate-300 bg-[#777c80] text-white text-xs">
                      {/* Row 1 */}
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={andesData.p1Stage1Pct}
                          onChange={(e) => updateAndesData({ p1Stage1Pct: e.target.value })}
                          className="w-16 px-2 py-1 bg-transparent text-right font-black border-r border-slate-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={andesData.p1Stage1Label}
                          onChange={(e) => updateAndesData({ p1Stage1Label: e.target.value })}
                          className="px-3 py-1 bg-transparent flex-1 font-bold focus:outline-none uppercase"
                        />
                      </div>
                      {/* Row 2 */}
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={andesData.p1Stage2Pct}
                          onChange={(e) => updateAndesData({ p1Stage2Pct: e.target.value })}
                          className="w-16 px-2 py-1 bg-transparent text-right font-black border-r border-slate-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={andesData.p1Stage2Label}
                          onChange={(e) => updateAndesData({ p1Stage2Label: e.target.value })}
                          className="px-3 py-1 bg-transparent flex-1 font-bold focus:outline-none uppercase"
                        />
                      </div>
                      {/* Row 3 */}
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={andesData.p1Stage3Pct}
                          onChange={(e) => updateAndesData({ p1Stage3Pct: e.target.value })}
                          className="w-16 px-2 py-1 bg-transparent text-right font-black border-r border-slate-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={andesData.p1Stage3Label}
                          onChange={(e) => updateAndesData({ p1Stage3Label: e.target.value })}
                          className="px-3 py-1 bg-transparent flex-1 font-bold focus:outline-none uppercase"
                        />
                      </div>
                      {/* Row 4 */}
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={andesData.p1Stage4Pct}
                          onChange={(e) => updateAndesData({ p1Stage4Pct: e.target.value })}
                          className="w-16 px-2 py-1 bg-transparent text-right font-black border-r border-slate-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={andesData.p1Stage4Label}
                          onChange={(e) => updateAndesData({ p1Stage4Label: e.target.value })}
                          className="px-3 py-1 bg-transparent flex-1 font-bold focus:outline-none uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Solid Corporate Banner: Official White Tierra Firme Logo */}
              <div className="bg-[#777c80] text-white px-8 py-5 flex items-center justify-center shrink-0">
                <img
                  src="/report_assets/logo_tierrafirme_white.png"
                  alt="Tierra Firme"
                  className="max-h-12 max-w-[280px] object-contain"
                />
              </div>
            </section>

            {/* PÁGINA 2: PARQUE DE LOS ANDES (FACHADAS) */}
            <section className="monthly-report-page monthly-report-preview-sheet flex flex-col justify-between font-sans text-slate-900 bg-white shadow-2xl relative select-text">
              {/* Right Margin Stripes (Red & Gray) */}
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-[#777c80] hidden sm:block" />
              <div className="absolute right-3 top-0 bottom-0 w-1 bg-red-700 hidden sm:block" />

              {/* Top Block Tab */}
              <div className="pt-0 pr-8 sm:pr-12 flex justify-end">
                <div className="bg-[#777c80] text-white font-black text-sm px-6 py-2.5 rounded-b-xl uppercase tracking-wider shadow-sm">
                  <input
                    type="text"
                    value={andesData.p2TabTitle}
                    onChange={(e) => updateAndesData({ p2TabTitle: e.target.value })}
                    className="bg-transparent text-center focus:outline-none w-32"
                  />
                </div>
              </div>

              <div className="p-8 sm:p-10 pr-8 sm:pr-14 flex-1 flex flex-col justify-between">
                <div>
                  <input
                    type="text"
                    value={andesData.p2Subtitle}
                    onChange={(e) => updateAndesData({ p2Subtitle: e.target.value })}
                    className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide focus:outline-none w-full border-b border-transparent hover:border-slate-300 pb-0.5 mb-4"
                  />
                </div>

                {/* 4 Photos Grid with Underlined Epigraphs */}
                <div className="grid grid-cols-2 gap-5 flex-1">
                  {/* Photo 1 */}
                  <div className="space-y-1.5 flex flex-col">
                    <div className="border-b border-slate-700 pb-0.5">
                      <input
                        type="text"
                        value={andesData.p2Photo1Title1}
                        onChange={(e) => updateAndesData({ p2Photo1Title1: e.target.value })}
                        className="text-[11px] font-bold text-slate-800 uppercase focus:outline-none w-full"
                      />
                      <input
                        type="text"
                        value={andesData.p2Photo1Title2}
                        onChange={(e) => updateAndesData({ p2Photo1Title2: e.target.value })}
                        className="text-[10px] text-slate-500 uppercase focus:outline-none w-full"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p2Photo1')}
                      className="group relative flex-1 min-h-[170px] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200"
                    >
                      <img src={andesData.p2Photo1} alt="P2 Foto 1" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="p-1.5 bg-slate-900/90 text-amber-300 rounded text-xs font-bold">Cambiar</span>
                      </div>
                    </div>
                  </div>

                  {/* Photo 2 */}
                  <div className="space-y-1.5 flex flex-col">
                    <div className="border-b border-slate-700 pb-0.5">
                      <input
                        type="text"
                        value={andesData.p2Photo2Title1}
                        onChange={(e) => updateAndesData({ p2Photo2Title1: e.target.value })}
                        className="text-[11px] font-bold text-slate-800 uppercase focus:outline-none w-full"
                      />
                      <input
                        type="text"
                        value={andesData.p2Photo2Title2}
                        onChange={(e) => updateAndesData({ p2Photo2Title2: e.target.value })}
                        className="text-[10px] text-slate-500 uppercase focus:outline-none w-full"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p2Photo2')}
                      className="group relative flex-1 min-h-[170px] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200"
                    >
                      <img src={andesData.p2Photo2} alt="P2 Foto 2" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="p-1.5 bg-slate-900/90 text-amber-300 rounded text-xs font-bold">Cambiar</span>
                      </div>
                    </div>
                  </div>

                  {/* Photo 3 */}
                  <div className="space-y-1.5 flex flex-col">
                    <div className="border-b border-slate-700 pb-0.5">
                      <input
                        type="text"
                        value={andesData.p2Photo3Title}
                        onChange={(e) => updateAndesData({ p2Photo3Title: e.target.value })}
                        className="text-[11px] font-bold text-slate-800 uppercase focus:outline-none w-full"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p2Photo3')}
                      className="group relative flex-1 min-h-[170px] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200"
                    >
                      <img src={andesData.p2Photo3} alt="P2 Foto 3" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="p-1.5 bg-slate-900/90 text-amber-300 rounded text-xs font-bold">Cambiar</span>
                      </div>
                    </div>
                  </div>

                  {/* Photo 4 (Cubierta 4° piso) */}
                  <div className="space-y-1.5 flex flex-col">
                    <div className="border-b border-slate-700 pb-0.5">
                      <input
                        type="text"
                        value={andesData.p2Photo4Title}
                        onChange={(e) => updateAndesData({ p2Photo4Title: e.target.value })}
                        className="text-[11px] font-bold text-slate-800 uppercase focus:outline-none w-full"
                      />
                    </div>
                    <div
                      onClick={() => triggerUpload('p2Photo4')}
                      className="group relative flex-1 min-h-[170px] bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200"
                    >
                      <img src={andesData.p2Photo4} alt="P2 Foto 4" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print">
                        <span className="p-1.5 bg-slate-900/90 text-amber-300 rounded text-xs font-bold">Cambiar</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with Dual Official Logos */}
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                  {/* Andes Official Logo */}
                  <img
                    src="/report_assets/logo_parque_de_los_andes.png"
                    alt="Edificio Parque de los Andes"
                    className="max-h-12 max-w-[170px] object-contain"
                  />
                  {/* Tierra Firme Color Logo */}
                  <img
                    src="/report_assets/logo_tierrafirme_color.png"
                    alt="Tierra Firme"
                    className="max-h-11 max-w-[190px] object-contain"
                  />
                </div>
              </div>
            </section>

            {/* PÁGINA 3: PARQUE DE LOS ANDES (INFORME TÉCNICO) */}
            <section className="monthly-report-page monthly-report-preview-sheet flex flex-col justify-between font-sans text-slate-900 bg-white shadow-2xl relative select-text">
              {/* Right Margin Stripes */}
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-[#777c80] hidden sm:block" />
              <div className="absolute right-3 top-0 bottom-0 w-1 bg-red-700 hidden sm:block" />

              {/* Top Block Tab */}
              <div className="pt-0 pr-8 sm:pr-12 flex justify-end">
                <div className="bg-[#777c80] text-white font-black text-sm px-6 py-2.5 rounded-b-xl uppercase tracking-wider shadow-sm">
                  <input
                    type="text"
                    value={andesData.p3TabTitle}
                    onChange={(e) => updateAndesData({ p3TabTitle: e.target.value })}
                    className="bg-transparent text-center focus:outline-none w-32"
                  />
                </div>
              </div>

              <div className="p-8 sm:p-10 pr-8 sm:pr-14 flex-1 flex flex-col justify-between space-y-4">
                {/* Document Title */}
                <div>
                  <input
                    type="text"
                    value={andesData.p3DocTitle}
                    onChange={(e) => updateAndesData({ p3DocTitle: e.target.value })}
                    className="text-base sm:text-lg font-black text-slate-800 focus:outline-none w-full border-b border-slate-300 pb-1"
                  />
                </div>

                {/* Structured Text Paragraphs */}
                <div className="space-y-3 text-xs sm:text-[12.5px] leading-relaxed text-slate-800 flex-1">
                  <textarea
                    rows={3}
                    value={andesData.p3Paragraph1}
                    onChange={(e) => updateAndesData({ p3Paragraph1: e.target.value })}
                    className="w-full bg-transparent focus:outline-none resize-none border-b border-transparent hover:border-slate-200"
                  />

                  <textarea
                    rows={4}
                    value={andesData.p3Paragraph2}
                    onChange={(e) => updateAndesData({ p3Paragraph2: e.target.value })}
                    className="w-full bg-transparent focus:outline-none resize-none border-b border-transparent hover:border-slate-200"
                  />

                  <textarea
                    rows={2}
                    value={andesData.p3Paragraph3}
                    onChange={(e) => updateAndesData({ p3Paragraph3: e.target.value })}
                    className="w-full bg-transparent focus:outline-none resize-none border-b border-transparent hover:border-slate-200"
                  />

                  <textarea
                    rows={3}
                    value={andesData.p3Paragraph4}
                    onChange={(e) => updateAndesData({ p3Paragraph4: e.target.value })}
                    className="w-full bg-transparent focus:outline-none resize-none border-b border-transparent hover:border-slate-200"
                  />

                  {/* Subheading & Next Tasks */}
                  <div className="pt-2">
                    <input
                      type="text"
                      value={andesData.p3Subheading}
                      onChange={(e) => updateAndesData({ p3Subheading: e.target.value })}
                      className="font-bold text-slate-900 focus:outline-none w-full mb-1"
                    />
                    <input
                      type="text"
                      value={andesData.p3NextTasksIntro}
                      onChange={(e) => updateAndesData({ p3NextTasksIntro: e.target.value })}
                      className="text-xs text-slate-700 italic focus:outline-none w-full mb-1"
                    />
                    <textarea
                      rows={4}
                      value={andesData.p3NextTasksList}
                      onChange={(e) => updateAndesData({ p3NextTasksList: e.target.value })}
                      className="w-full bg-transparent focus:outline-none resize-none border-b border-transparent hover:border-slate-200 pl-2"
                    />
                  </div>

                  <textarea
                    rows={3}
                    value={andesData.p3Conclusion}
                    onChange={(e) => updateAndesData({ p3Conclusion: e.target.value })}
                    className="w-full bg-transparent focus:outline-none resize-none border-b border-transparent hover:border-slate-200 pt-1"
                  />
                </div>

                {/* Footer with Dual Official Logos */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
                  <img
                    src="/report_assets/logo_parque_de_los_andes.png"
                    alt="Edificio Parque de los Andes"
                    className="max-h-12 max-w-[170px] object-contain"
                  />
                  <img
                    src="/report_assets/logo_tierrafirme_color.png"
                    alt="Tierra Firme"
                    className="max-h-11 max-w-[190px] object-contain"
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
