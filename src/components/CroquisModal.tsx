import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  PenTool,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Share2,
  Save,
  Check,
  Grid,
  Square,
  Circle,
  MoveRight,
  Minus,
  Type,
  Maximize2,
  Minimize2,
  Sparkles,
  Building2,
  DoorOpen,
  Calendar,
  Eraser,
  Pencil,
  Highlighter,
  Layers,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { Project, Unit, SketchDocument } from '../types';

interface CroquisModalProps {
  isOpen: boolean;
  project: Project;
  initialUnitId?: string;
  onClose: () => void;
  onSaveSketch: (unitId: string, sketch: SketchDocument) => void;
  onDeleteSketch?: (unitId: string, sketchId: string) => void;
}

type ToolType = 'pen' | 'highlighter' | 'line' | 'arrow' | 'rect' | 'circle' | 'text' | 'eraser';
type PaperType = 'white' | 'grid' | 'lines' | 'dark';

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const COLOR_PALETTE = [
  { label: 'Negro Carbón', value: '#0f172a' },
  { label: 'Rojo Obra', value: '#dc2626' },
  { label: 'Azul Técnico', value: '#2563eb' },
  { label: 'Verde Instalación', value: '#16a34a' },
  { label: 'Naranja / Cota', value: '#ea580c' },
  { label: 'Amarillo Resalte', value: '#eab308' },
  { label: 'Blanco', value: '#ffffff' }
];

const STROKE_WIDTHS = [
  { label: 'Fino', value: 2 },
  { label: 'Medio', value: 4 },
  { label: 'Grueso', value: 8 },
  { label: 'Resaltador', value: 16 }
];

const PRESET_REFERENCES = [
  'Instalación Sanitaria',
  'Modificación de Tabique',
  'Instalación Eléctrica',
  'Pérdida / Fuga de Agua',
  'Detalle Constructivo',
  'Desagüe y Pendientes',
  'Alineación y Escuadra',
  'Medidas en Sitio'
];

export function CroquisModal({
  isOpen,
  project,
  initialUnitId,
  onClose,
  onSaveSketch,
  onDeleteSketch
}: CroquisModalProps) {
  // Active selected unit
  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => {
    if (initialUnitId && project.units.some(u => u.id === initialUnitId)) {
      return initialUnitId;
    }
    return project.units.length > 0 ? project.units[0].id : '';
  });

  const [activeTab, setActiveTab] = useState<'draw' | 'history'>('draw');
  const [sketchTitle, setSketchTitle] = useState<string>('Croquis en sitio');
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [paperType, setPaperType] = useState<PaperType>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  // Undo / Redo history stacks
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Current Unit Object
  const currentUnit = project.units.find(u => u.id === selectedUnitId) || project.units[0];
  const unitSketches = currentUnit?.sketches || [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync initialUnitId when prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialUnitId && project.units.some(u => u.id === initialUnitId)) {
        setSelectedUnitId(initialUnitId);
      } else if (project.units.length > 0 && !selectedUnitId) {
        setSelectedUnitId(project.units[0].id);
      }
    }
  }, [isOpen, initialUnitId, project.units]);

  // Update history availability flags
  const updateHistoryState = () => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  };

  // Save current canvas state to undo stack
  const pushUndoState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(imageData);
    if (undoStackRef.current.length > 25) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    updateHistoryState();
  };

  // Initialize Canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(600, Math.floor(rect.width));
    const height = Math.max(450, Math.floor(rect.height));

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear with transparent layer (paper background is handled via CSS / composite export)
    ctx.clearRect(0, 0, width, height);

    undoStackRef.current = [];
    redoStackRef.current = [];
    updateHistoryState();
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const timer = setTimeout(() => {
        initCanvas();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, initCanvas, isFullscreen]);

  // Undo Handler
  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || undoStackRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current to redo
    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoStackRef.current.push(currentImg);

    // Pop from undo
    const prevImg = undoStackRef.current.pop()!;
    ctx.putImageData(prevImg, 0, 0);
    updateHistoryState();
  };

  // Redo Handler
  const handleRedo = () => {
    const canvas = canvasRef.current;
    if (!canvas || redoStackRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current to undo
    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(currentImg);

    // Pop from redo
    const nextImg = redoStackRef.current.pop()!;
    ctx.putImageData(nextImg, 0, 0);
    updateHistoryState();
  };

  // Clear Canvas
  const handleClear = () => {
    if (!confirm('¿Deseas limpiar todo el dibujo de la hoja?')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushUndoState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Pointer coordinate calculation (supports mouse, touch, and stylus pen)
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    return { x, y, pressure };
  };

  // Pointer Down (Pen / Touch / Mouse Start)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture pointer to prevent losing events outside canvas
    e.currentTarget.setPointerCapture(e.pointerId);

    const { x, y } = getCanvasPoint(e);
    isDrawingRef.current = true;
    startPointRef.current = { x, y };

    // Push previous state for undo
    pushUndoState();

    // Snapshot for shape previews (line, rect, circle, arrow)
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y); // Initial point dot
      applyContextStyle(ctx, e.pressure);
      ctx.stroke();
    } else if (tool === 'text') {
      const text = prompt('Escribe el texto o cota para este punto del croquis:');
      if (text && text.trim()) {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(text.trim(), x, y);
      }
      isDrawingRef.current = false;
    }
  };

  // Context Styling Configuration
  const applyContextStyle = (ctx: CanvasRenderingContext2D, pressure = 0.5) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 3.5;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.globalAlpha = 1.0;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = Math.max(12, strokeWidth * 2.5);
      ctx.globalAlpha = 0.35;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      // Stylus pressure modulation
      const effectiveWidth = Math.max(1, strokeWidth * (0.6 + pressure * 0.8));
      ctx.lineWidth = effectiveWidth;
      ctx.globalAlpha = 1.0;
    }
  };

  // Pointer Move (Pen / Touch / Mouse Drawing)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !startPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y, pressure } = getCanvasPoint(e);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      applyContextStyle(ctx, pressure);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      // Shape Preview: Restore snapshot before drawing current preview
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }

      applyContextStyle(ctx, 0.5);
      const startX = startPointRef.current.x;
      const startY = startPointRef.current.y;

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === 'arrow') {
        drawArrow(ctx, startX, startY, x, y, strokeWidth);
      } else if (tool === 'rect') {
        ctx.strokeRect(startX, startY, x - startX, y - startY);
      } else if (tool === 'circle') {
        const radiusX = Math.abs(x - startX) / 2;
        const radiusY = Math.abs(y - startY) / 2;
        const centerX = Math.min(startX, x) + radiusX;
        const centerY = Math.min(startY, y) + radiusY;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  // Pointer Up / Cancel (End of stroke)
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    startPointRef.current = null;
    snapshotRef.current = null;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already released
    }
  };

  // Helper: Draw Arrow with head
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number
  ) => {
    const headLen = Math.max(10, width * 3);
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLen * Math.cos(angle - Math.PI / 6),
      toY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLen * Math.cos(angle + Math.PI / 6),
      toY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  // Generate Composite High-Res Image with Official Construction Technical Header
  const generateCompositeSketchImage = (): string | null => {
    const drawingCanvas = canvasRef.current;
    if (!drawingCanvas) return null;

    const outCanvas = document.createElement('canvas');
    const width = 1200;
    const headerHeight = 150;
    const bodyHeight = 900;
    const footerHeight = 40;
    const totalHeight = headerHeight + bodyHeight + footerHeight;

    outCanvas.width = width;
    outCanvas.height = totalHeight;

    const ctx = outCanvas.getContext('2d');
    if (!ctx) return null;

    // 1. Draw Technical Header (Membrete de Obra)
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, width, headerHeight);

    // Accent line in Amber
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, headerHeight - 4, width, 4);

    // Title
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('📐 CROQUIS TÉCNICO DE OBRA EN TERRENO', 30, 42);

    // Subheader: Obra & Depto
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`OBRA: ${project.name.toUpperCase()}   |   ESPACIO: ${(currentUnit?.name || 'Unidad').toUpperCase()}`, 30, 80);

    // Date & Reference
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const timestamp = `${dateStr}, ${timeStr} hs`;

    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.font = '15px sans-serif';
    ctx.fillText(`Fecha: ${timestamp}   |   Ref: ${sketchTitle || 'Relevamiento a mano alzada'}`, 30, 115);

    // 2. Draw Paper Background in Body
    const bodyY = headerHeight;
    if (paperType === 'dark') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, bodyY, width, bodyHeight);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, bodyY, width, bodyHeight);

      if (paperType === 'grid') {
        // Architectural grid lines
        ctx.strokeStyle = '#e2e8f0'; // Light slate grid
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let gx = 0; gx <= width; gx += gridSize) {
          ctx.beginPath();
          ctx.moveTo(gx, bodyY);
          ctx.lineTo(gx, bodyY + bodyHeight);
          ctx.stroke();
        }
        for (let gy = bodyY; gy <= bodyY + bodyHeight; gy += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
          ctx.stroke();
        }
      } else if (paperType === 'lines') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const lineSpacing = 35;
        for (let ly = bodyY + lineSpacing; ly <= bodyY + bodyHeight; ly += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(30, ly);
          ctx.lineTo(width - 30, ly);
          ctx.stroke();
        }
      }
    }

    // 3. Draw the User's Drawing scaled to body
    ctx.drawImage(drawingCanvas, 0, bodyY, width, bodyHeight);

    // 4. Footer Watermark
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, totalHeight - footerHeight, width, footerHeight);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Control de Avance - Registro de Terreno y Auditoría Técnica', 30, totalHeight - 16);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('SUPERVISIÓN EN OBRA', width - 200, totalHeight - 16);

    return outCanvas.toDataURL('image/png', 0.95);
  };

  // Save to Department & Supabase Cloud
  const handleSaveToUnit = () => {
    if (!currentUnit) return;
    const finalDataUrl = generateCompositeSketchImage();
    if (!finalDataUrl) {
      showToast('Error al generar la imagen del croquis');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const timestamp = `${dateStr}, ${timeStr} hs`;

    const newSketch: SketchDocument = {
      id: `sk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: sketchTitle.trim() || 'Croquis a mano alzada',
      dataUrl: finalDataUrl,
      createdAt: timestamp,
      unitId: currentUnit.id,
      unitName: currentUnit.name,
      projectId: project.id,
      projectName: project.name
    };

    onSaveSketch(currentUnit.id, newSketch);
    showToast(`Croquis guardado en ${currentUnit.name} y en la Nube ✔`);
  };

  // Download Image
  const handleDownload = (dataUrl?: string, title?: string) => {
    const targetUrl = dataUrl || generateCompositeSketchImage();
    if (!targetUrl) return;

    const cleanProject = project.name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanUnit = (currentUnit?.name || 'Unidad').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Croquis_${cleanProject}_${cleanUnit}_${dateStr}.png`;

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Imagen descargada en tu dispositivo');
  };

  // Share via WhatsApp (with file on mobile/tablet, web fallback on desktop)
  const handleShareWhatsApp = async (customDataUrl?: string, customTitle?: string) => {
    const targetUrl = customDataUrl || generateCompositeSketchImage();
    if (!targetUrl) return;

    const unitName = currentUnit?.name || 'Unidad';
    const titleToShare = customTitle || sketchTitle || 'Relevamiento en terreno';

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const timestamp = `${dateStr}, ${timeStr} hs`;

    const messageText = `📐 *CROQUIS TÉCNICO DE OBRA*\n` +
      `🏢 *Obra:* ${project.name}\n` +
      `🚪 *Departamento / Espacio:* ${unitName}\n` +
      `📅 *Fecha:* ${timestamp}\n` +
      `📝 *Referencia:* ${titleToShare}\n\n` +
      `Adjunto registro gráfico a mano alzada realizado en sitio.`;

    try {
      // Check if Web Share API supports file sharing (Android, iOS, iPadOS)
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `Croquis_${project.name.replace(/\s+/g, '_')}_${unitName.replace(/\s+/g, '_')}.png`,
        { type: 'image/png' }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Croquis ${unitName} - ${project.name}`,
          text: messageText
        });
        showToast('Compartido con éxito');
        return;
      }
    } catch (err) {
      console.log('Web Share not supported or dismissed:', err);
    }

    // Fallback: Download image and open WhatsApp Web
    handleDownload(targetUrl, titleToShare);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
    showToast('Se abrió WhatsApp y se descargó la imagen para adjuntarla');
  };

  // Load an existing sketch from history back into the canvas
  const handleLoadSketchToCanvas = (dataUrl: string, title: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      pushUndoState();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setSketchTitle(title);
      setActiveTab('draw');
      showToast('Croquis cargado en el lienzo para continuar');
    };
    img.src = dataUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[92vh] max-h-[900px]'
        }`}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl border border-amber-500 flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0">
              <PenTool className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                  <span>CROQUIS DE OBRA</span>
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                    Mano Alzada
                  </span>
                </h2>
              </div>
              <p className="text-xs text-amber-400/90 font-bold truncate flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{project.name}</span>
                <span className="text-slate-500">•</span>
                <DoorOpen className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{currentUnit?.name || 'Unidad'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tab switch */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 mr-1">
              <button
                onClick={() => setActiveTab('draw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all touch-target ${
                  activeTab === 'draw'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Lienzo</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all touch-target ${
                  activeTab === 'history'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Historial ({unitSketches.length})</span>
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors hidden sm:flex touch-target"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa para tablet'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-rose-600/30 hover:border-rose-500 rounded-xl transition-colors touch-target"
              title="Cerrar croquis"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Drawing Canvas & Tools */}
        {activeTab === 'draw' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-100 dark:bg-slate-950">
            {/* Top Config: Unit Selector & Title */}
            <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                {/* Unit Selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <DoorOpen className="w-3.5 h-3.5 text-amber-500" />
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer pr-1"
                  >
                    {project.units.map(u => (
                      <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {u.name} {u.type === 'common_area' ? '(Común)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title Input */}
                <input
                  type="text"
                  value={sketchTitle}
                  onChange={(e) => setSketchTitle(e.target.value)}
                  placeholder="Referencia del croquis (ej: Instalación sanitaria baño)"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Quick reference chips */}
              <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar">
                {PRESET_REFERENCES.slice(0, 4).map(preset => (
                  <button
                    key={preset}
                    onClick={() => setSketchTitle(preset)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawing Tools Toolbar */}
            <div className="p-2 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar text-xs">
              {/* Primary Tools */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTool('pen')}
                  className={`p-2 rounded-xl flex items-center gap-1 font-bold transition-all touch-target ${
                    tool === 'pen'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Lápiz / Pluma para trazo libre"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Lápiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('highlighter')}
                  className={`p-2 rounded-xl flex items-center gap-1 font-bold transition-all touch-target ${
                    tool === 'highlighter'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Resaltador / Marcador semitransparente"
                >
                  <Highlighter className="w-4 h-4" />
                  <span className="hidden sm:inline">Marcador</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('line')}
                  className={`p-2 rounded-xl flex items-center gap-1 font-bold transition-all touch-target ${
                    tool === 'line'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Línea recta (paredes, tabiques, cotas)"
                >
                  <Minus className="w-4 h-4" />
                  <span className="hidden sm:inline">Línea</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('arrow')}
                  className={`p-2 rounded-xl flex items-center gap-1 font-bold transition-all touch-target ${
                    tool === 'arrow'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Flecha para indicar detalles o medidas"
                >
                  <MoveRight className="w-4 h-4" />
                  <span className="hidden sm:inline">Flecha</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('rect')}
                  className={`p-2 rounded-xl flex items-center gap-1 font-bold transition-all touch-target ${
                    tool === 'rect'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Rectángulo (ambientes, vanos, aberturas)"
                >
                  <Square className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setTool('circle')}
                  className={`p-2 rounded-xl flex items-center gap-1 font-bold transition-all touch-target ${
                    tool === 'circle'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Círculo (caños, bocas de luz, pases de losa)"
                >
                  <Circle className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setTool('text')}
                  className={`p-2 rounded-xl flex items-center gap-1 font-bold transition-all touch-target ${
                    tool === 'text'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Texto / Cotas mecanografiadas"
                >
                  <Type className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setTool('eraser')}
                  className={`p-2 rounded-xl flex items-center gap-1 font-bold transition-all touch-target ${
                    tool === 'eraser'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title="Goma de borrar trazos"
                >
                  <Eraser className="w-4 h-4" />
                  <span className="hidden sm:inline">Goma</span>
                </button>
              </div>

              {/* Stroke Width Selector */}
              <div className="flex items-center gap-1 border-l border-r border-slate-200 dark:border-slate-800 px-2">
                {STROKE_WIDTHS.map(sw => (
                  <button
                    key={sw.value}
                    onClick={() => setStrokeWidth(sw.value)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all touch-target ${
                      strokeWidth === sw.value
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    title={`Grosor ${sw.label}`}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{ width: `${Math.min(12, sw.value * 1.5 + 2)}px`, height: `${Math.min(12, sw.value * 1.5 + 2)}px` }}
                    />
                  </button>
                ))}
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-1">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setColor(c.value);
                      if (tool === 'eraser') setTool('pen');
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform touch-target flex-shrink-0 ${
                      color === c.value && tool !== 'eraser'
                        ? 'scale-125 border-amber-500 shadow-sm'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
                {/* HTML Color Picker */}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    if (tool === 'eraser') setTool('pen');
                  }}
                  className="w-6 h-6 p-0 border-0 rounded-full cursor-pointer bg-transparent"
                  title="Color personalizado"
                />
              </div>

              {/* Paper Background Selector */}
              <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                <button
                  type="button"
                  onClick={() => setPaperType('white')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    paperType === 'white'
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                  title="Hoja Blanca lisa"
                >
                  Blanco
                </button>
                <button
                  type="button"
                  onClick={() => setPaperType('grid')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                    paperType === 'grid'
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                  title="Hoja Cuadriculada / Milimetrada (ideal arquitectura)"
                >
                  <Grid className="w-3 h-3" />
                  <span className="hidden sm:inline">Cuadrícula</span>
                </button>
              </div>

              {/* Undo / Redo & Clear */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={handleUndo}
                  className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 touch-target"
                  title="Deshacer trazo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={handleRedo}
                  className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 touch-target"
                  title="Rehacer trazo"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors touch-target"
                  title="Borrar todo el dibujo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawing Canvas Area */}
            <div className="flex-1 p-2 sm:p-4 flex items-center justify-center overflow-hidden min-h-0 relative">
              {/* Paper Container */}
              <div
                className={`w-full h-full rounded-2xl shadow-inner border border-slate-300 dark:border-slate-800 relative overflow-hidden flex items-center justify-center touch-none ${
                  paperType === 'dark'
                    ? 'bg-slate-900'
                    : paperType === 'grid'
                    ? 'bg-white bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]'
                    : paperType === 'lines'
                    ? 'bg-white bg-[linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:100%_28px]'
                    : 'bg-white'
                }`}
              >
                {/* Visual Stamp Indicator on Sheet */}
                <div className="absolute top-2 left-3 pointer-events-none opacity-40 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {project.name} • {currentUnit?.name || 'Unidad'}
                </div>

                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="w-full h-full cursor-crosshair touch-none select-none block"
                  style={{ touchAction: 'none' }}
                />
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Dibujo a mano alzada optimizado para lápiz óptico / S-Pen / touch</span>
              </div>

              <div className="flex items-center gap-2">
                {/* WhatsApp Share Button */}
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp()}
                  className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 touch-target"
                  title="Enviar croquis por WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                  <span>Enviar WhatsApp</span>
                </button>

                {/* Download PNG Button */}
                <button
                  type="button"
                  onClick={() => handleDownload()}
                  className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/40 shadow-xs flex items-center gap-1.5 transition-all active:scale-95 touch-target"
                  title="Descargar croquis en imagen de alta resolución"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Descargar</span>
                </button>

                {/* Save to Unit Button */}
                <button
                  type="button"
                  onClick={handleSaveToUnit}
                  className="px-4 sm:px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 touch-target"
                  title="Guardar croquis en este departamento y sincronizar en la nube"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar en {currentUnit?.name || 'Depto'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Department Sketches History */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Croquis Guardados en {currentUnit?.name || 'este departamento'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black">
                    {unitSketches.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro gráfico histórico del departamento guardado en la nube.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('draw')}
                className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 touch-target shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Nuevo Croquis</span>
              </button>
            </div>

            {unitSketches.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <PenTool className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No hay croquis guardados en {currentUnit?.name || 'esta unidad'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                  Abre la pestaña de lienzo para hacer un dibujo a mano alzada con tu tablet y guárdalo aquí.
                </p>
                <button
                  onClick={() => setActiveTab('draw')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs"
                >
                  Comenzar a Dibujar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unitSketches.map(sketch => (
                  <div
                    key={sketch.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-950 overflow-hidden border-b border-slate-200 dark:border-slate-800 group">
                      <img
                        src={sketch.dataUrl}
                        alt={sketch.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-amber-400 px-2 py-0.5 rounded-lg">
                          {sketch.createdAt}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {sketch.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sketch.unitName || currentUnit?.name} • {sketch.projectName || project.name}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          {/* WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(sketch.dataUrl, sketch.title)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors touch-target"
                            title="Enviar por WhatsApp"
                          >
                            <WhatsAppIcon className="w-4 h-4 fill-emerald-600" />
                          </button>

                          {/* Download */}
                          <button
                            type="button"
                            onClick={() => handleDownload(sketch.dataUrl, sketch.title)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors touch-target"
                            title="Descargar imagen"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Open in canvas to continue */}
                          <button
                            type="button"
                            onClick={() => handleLoadSketchToCanvas(sketch.dataUrl, sketch.title)}
                            className="px-2 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors flex items-center gap-1 touch-target"
                            title="Abrir este croquis en el lienzo para seguir dibujando"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Continuar</span>
                          </button>
                        </div>

                        {/* Delete button */}
                        {onDeleteSketch && (
                          <button
                            type="button"
                            onClick={() => onDeleteSketch(currentUnit.id, sketch.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors touch-target"
                            title="Eliminar croquis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
