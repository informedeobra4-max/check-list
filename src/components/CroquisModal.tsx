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
  Building2,
  DoorOpen,
  Calendar,
  Eraser,
  Pencil,
  Highlighter,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Camera,
  Upload,
  FileText,
  Compass,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Project, Unit, SketchDocument, BlueprintDocument } from '../types';

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

interface BackgroundDoc {
  dataUrl: string;
  name: string;
  type: 'camera' | 'image' | 'pdf';
  page?: number;
  totalPages?: number;
  fileBlob?: Blob;
  opacity: number;
}

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const COLOR_PALETTE = [
  { label: 'Rojo Obra', value: '#dc2626' },
  { label: 'Negro Carbón', value: '#0f172a' },
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

/**
 * Loads a PDF page and renders it to a sharp PNG data URL using PDF.js CDN
 */
async function renderPdfPageToDataUrl(
  fileOrBlob: Blob,
  pageNumber = 1
): Promise<{ dataUrl: string; totalPages: number }> {
  if (!(window as any).pdfjsLib) {
    await new Promise((resolve, reject) => {
      const existing = document.getElementById('pdfjs-cdn-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.id = 'pdfjs-cdn-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        try {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(true);
        } catch {
          resolve(true);
        }
      };
      script.onerror = () => reject(new Error('No se pudo cargar el motor PDF'));
      document.head.appendChild(script);
    });
  }

  const pdfjsLib = (window as any).pdfjsLib;
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const targetPage = Math.max(1, Math.min(pageNumber, totalPages));
  const page = await pdf.getPage(targetPage);

  // Render at 2.0 scale for sharp blueprint lines
  const viewport = page.getViewport({ scale: 2.0 });
  const offscreen = document.createElement('canvas');
  offscreen.width = viewport.width;
  offscreen.height = viewport.height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  await page.render({ canvasContext: ctx, viewport }).promise;
  return {
    dataUrl: offscreen.toDataURL('image/png', 0.95),
    totalPages
  };
}

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
  const [color, setColor] = useState<string>('#dc2626'); // Red default for technical markups
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [paperType, setPaperType] = useState<PaperType>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Background Document / Photo / PDF state
  const [bgDocument, setBgDocument] = useState<BackgroundDoc | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isBlueprintsDropdownOpen, setIsBlueprintsDropdownOpen] = useState(false);

  // File Inputs Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas & Container Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
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
  const unitBlueprints = currentUnit?.blueprints || [];

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

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoStackRef.current.push(imageData);
      if (undoStackRef.current.length > 25) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
      updateHistoryState();
    } catch (err) {
      console.error('Error pushing undo state:', err);
    }
  };

  // High-precision Canvas Initialization & Resizing
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    // Save previous drawing content if canvas already had strokes
    let prevData: ImageData | null = null;
    try {
      if (canvas.width > 0 && canvas.height > 0) {
        prevData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    } catch {
      // ignore
    }

    // Set physical buffer size
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    // Set CSS displayed size explicitly matching container to ensure 1:1 screen mapping
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    // Scale context by devicePixelRatio
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (prevData) {
      try {
        ctx.putImageData(prevData, 0, 0);
      } catch {
        // ignore
      }
    } else {
      ctx.clearRect(0, 0, w, h);
    }

    updateHistoryState();
  }, []);

  // ResizeObserver on the paper container to keep 1:1 precision at all times
  useEffect(() => {
    if (!isOpen || activeTab !== 'draw') return;

    const container = containerRef.current;
    if (!container) return;

    // Run after layout settle
    const initTimer = setTimeout(() => {
      initCanvas();
    }, 100);

    let resizeTimer: any = null;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initCanvas();
      }, 50);
    });

    observer.observe(container);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
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
    if (!confirm('¿Deseas limpiar todos los trazos dibujados sobre la hoja?')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushUndoState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  /**
   * High-Precision Point Mapping:
   * Maps physical screen pointer (stylus/touch/mouse) directly to canvas logical coordinate space.
   * This completely eliminates any lateral offset (e.g. 7mm shift) by computing the true scale ratio.
   */
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Logical canvas dimensions expected by 2D context
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;

    // Absolute scale ratio between screen CSS pixels and context coordinates
    const scaleX = logicalWidth / (rect.width || 1);
    const scaleY = logicalHeight / (rect.height || 1);

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // S-Pen / Apple Pencil stylus pressure
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;

    return { x, y, pressure };
  };

  // Context Styling Configuration
  const applyContextStyle = (ctx: CanvasRenderingContext2D, pressure = 0.5) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 4.0;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.globalAlpha = 1.0;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = Math.max(14, strokeWidth * 2.8);
      ctx.globalAlpha = 0.38;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      // Stylus pressure dynamic modulation
      const effectiveWidth = Math.max(1, strokeWidth * (0.65 + pressure * 0.7));
      ctx.lineWidth = effectiveWidth;
      ctx.globalAlpha = 1.0;
    }
  };

  // Pointer Down (Pen / Touch / Mouse Start)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    const { x, y, pressure } = getCanvasPoint(e);
    isDrawingRef.current = true;
    startPointRef.current = { x, y };

    pushUndoState();

    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      applyContextStyle(ctx, pressure);
      ctx.stroke();
    } else if (tool === 'text') {
      const text = prompt('Escribe el texto, cota o anotación para este punto:');
      if (text && text.trim()) {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(text.trim(), x, y);
      }
      isDrawingRef.current = false;
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
      // Shape Preview: Restore snapshot before drawing preview
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

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    startPointRef.current = null;
    snapshotRef.current = null;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Helper: Draw Arrow with arrow head
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number
  ) => {
    const headLen = Math.max(12, width * 3.2);
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

  // Handling Image / PDF / Camera file selection
  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
      if (isPdf) {
        showToast('Procesando archivo PDF...');
        const result = await renderPdfPageToDataUrl(file, 1);
        setBgDocument({
          dataUrl: result.dataUrl,
          name: file.name,
          type: 'pdf',
          page: 1,
          totalPages: result.totalPages,
          fileBlob: file,
          opacity: 0.95
        });
        if (sketchTitle === 'Croquis en sitio') {
          setSketchTitle(`Anotaciones: ${file.name.replace(/\.[^/.]+$/, '')}`);
        }
        showToast(`Plano PDF cargado (${result.totalPages} ${result.totalPages === 1 ? 'pág' : 'págs'})`);
      } else {
        // Image or Live Camera Photo
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            setBgDocument({
              dataUrl,
              name: isCamera ? `Foto de Obra (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : file.name,
              type: isCamera ? 'camera' : 'image',
              opacity: 0.95
            });
            if (sketchTitle === 'Croquis en sitio') {
              setSketchTitle(isCamera ? 'Detalle fotográfico en sitio' : `Anotaciones: ${file.name.replace(/\.[^/.]+$/, '')}`);
            }
            showToast(isCamera ? 'Foto tomada y lista para dibujar encima' : 'Imagen cargada en el lienzo');
          }
          setIsLoadingFile(false);
        };
        reader.onerror = () => {
          setIsLoadingFile(false);
          showToast('Error al leer la imagen');
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (err: any) {
      console.error('Error loading file onto croquis canvas:', err);
      showToast('No se pudo procesar el archivo');
    } finally {
      setIsLoadingFile(false);
      // Reset input value
      e.target.value = '';
    }
  };

  // Switching page of an existing PDF background document
  const handlePdfPageChange = async (newPage: number) => {
    if (!bgDocument || !bgDocument.fileBlob || bgDocument.type !== 'pdf') return;
    setIsLoadingFile(true);
    try {
      const result = await renderPdfPageToDataUrl(bgDocument.fileBlob, newPage);
      setBgDocument(prev => prev ? {
        ...prev,
        dataUrl: result.dataUrl,
        page: newPage
      } : null);
      showToast(`Página ${newPage} de ${result.totalPages} cargada`);
    } catch (err) {
      console.error('Error changing PDF page:', err);
      showToast('Error al cambiar de página');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Load an existing blueprint from the unit into the croquis background
  const handleLoadBlueprintAsBackground = async (bp: BlueprintDocument) => {
    setIsBlueprintsDropdownOpen(false);
    setIsLoadingFile(true);

    try {
      if (bp.type === 'image') {
        setBgDocument({
          dataUrl: bp.url,
          name: bp.name,
          type: 'image',
          opacity: 0.95
        });
        if (sketchTitle === 'Croquis en sitio') {
          setSketchTitle(`Sobre plano: ${bp.name}`);
        }
        showToast(`Plano "${bp.name}" cargado en el fondo`);
      } else if (bp.type === 'pdf') {
        showToast('Cargando plano PDF...');
        const res = await fetch(bp.url);
        const blob = await res.blob();
        const result = await renderPdfPageToDataUrl(blob, 1);
        setBgDocument({
          dataUrl: result.dataUrl,
          name: bp.name,
          type: 'pdf',
          page: 1,
          totalPages: result.totalPages,
          fileBlob: blob,
          opacity: 0.95
        });
        if (sketchTitle === 'Croquis en sitio') {
          setSketchTitle(`Sobre plano: ${bp.name}`);
        }
        showToast(`Plano PDF "${bp.name}" cargado`);
      }
    } catch (err) {
      console.error('Error loading blueprint as background:', err);
      showToast('No se pudo cargar el plano');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Generate Composite High-Res Image with Official Technical Header & Background Image
  const generateCompositeSketchImage = async (): Promise<string | null> => {
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
    ctx.fillText(
      `OBRA: ${project.name.toUpperCase()}   |   ESPACIO: ${(currentUnit?.name || 'Unidad').toUpperCase()}`,
      30,
      80
    );

    // Date & Reference
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const timestamp = `${dateStr}, ${timeStr} hs`;

    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.font = '15px sans-serif';
    const bgInfo = bgDocument ? ` [Base: ${bgDocument.name}${bgDocument.page ? ` Pág ${bgDocument.page}` : ''}]` : '';
    ctx.fillText(`Fecha: ${timestamp}   |   Ref: ${sketchTitle || 'Relevamiento a mano alzada'}${bgInfo}`, 30, 115);

    // 2. Draw Paper Background or Document Underlay in Body
    const bodyY = headerHeight;

    if (bgDocument) {
      // White container background behind document
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, bodyY, width, bodyHeight);

      // Draw the background image fitted preserving aspect ratio
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const imgRatio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
          const bodyRatio = width / bodyHeight;
          let drawW = width;
          let drawH = bodyHeight;
          let drawX = 0;
          let drawY = bodyY;

          if (imgRatio > bodyRatio) {
            drawW = width;
            drawH = width / imgRatio;
            drawY = bodyY + (bodyHeight - drawH) / 2;
          } else {
            drawH = bodyHeight;
            drawW = bodyHeight * imgRatio;
            drawX = (width - drawW) / 2;
          }

          ctx.save();
          ctx.globalAlpha = bgDocument.opacity;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = bgDocument.dataUrl;
      });
    } else {
      // Standard paper styling
      if (paperType === 'dark') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, bodyY, width, bodyHeight);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, bodyY, width, bodyHeight);

        if (paperType === 'grid') {
          ctx.strokeStyle = '#e2e8f0';
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
    }

    // 3. Draw User's Annotations & Hand-Drawn Strokes scaled to body
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
  const handleSaveToUnit = async () => {
    if (!currentUnit) return;
    const finalDataUrl = await generateCompositeSketchImage();
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
  const handleDownload = async (dataUrl?: string, title?: string) => {
    const targetUrl = dataUrl || (await generateCompositeSketchImage());
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
    const targetUrl = customDataUrl || (await generateCompositeSketchImage());
    if (!targetUrl) return;

    const unitName = currentUnit?.name || 'Unidad';
    const titleToShare = customTitle || sketchTitle || 'Relevamiento en terreno';

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const timestamp = `${dateStr}, ${timeStr} hs`;

    const messageText =
      `📐 *CROQUIS TÉCNICO DE OBRA*\n` +
      `🏢 *Obra:* ${project.name}\n` +
      `🚪 *Departamento / Espacio:* ${unitName}\n` +
      `📅 *Fecha:* ${timestamp}\n` +
      `📝 *Referencia:* ${titleToShare}\n\n` +
      `Adjunto registro gráfico a mano alzada realizado en sitio.`;

    try {
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
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[94vh] max-h-[950px]'
        }`}
      >
        {/* Hidden Camera Input */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFilePicked(e, true)}
          className="hidden"
        />

        {/* Hidden File Picker Input (Images or PDFs) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          onChange={(e) => handleFilePicked(e, false)}
          className="hidden"
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl border border-amber-500 flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Loading File Overlay */}
        {isLoadingFile && (
          <div className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black tracking-wide text-amber-400 uppercase">
              Cargando documento en el lienzo...
            </p>
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
                    Precisión Lápiz
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
                  activeTab === 'draw' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Lienzo</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all touch-target ${
                  activeTab === 'history' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
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
                    {project.units.map((u) => (
                      <option
                        key={u.id}
                        value={u.id}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
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

              {/* Import Actions: Camera, File/PDF, Blueprints */}
              <div className="flex items-center gap-1.5">
                {/* Take Live Photo Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-all touch-target shadow-2xs active:scale-95"
                  title="Tomar foto con la cámara para dibujar anotaciones encima"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Foto</span>
                </button>

                {/* Pick Image or PDF Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-all touch-target shadow-2xs active:scale-95"
                  title="Buscar imagen o plano PDF en los archivos para escribir encima"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-500" />
                  <span>Imagen / PDF</span>
                </button>

                {/* Unit Blueprints Dropdown if unit has plans */}
                {unitBlueprints.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsBlueprintsDropdownOpen(!isBlueprintsDropdownOpen)}
                      className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 transition-all touch-target shadow-2xs active:scale-95"
                      title="Cargar uno de los planos técnicos guardados en esta unidad"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-500" />
                      <span>Planos ({unitBlueprints.length})</span>
                    </button>

                    {isBlueprintsDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-1 z-30 animate-in fade-in slide-in-from-top-2">
                        <div className="px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          Planos de {currentUnit?.name}:
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {unitBlueprints.map((bp) => (
                            <button
                              key={bp.id}
                              type="button"
                              onClick={() => handleLoadBlueprintAsBackground(bp)}
                              className="w-full text-left px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1.5 transition-colors"
                            >
                              <div className="truncate">
                                <p className="truncate">{bp.name}</p>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-black">
                                  {bp.category} • {bp.type.toUpperCase()}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                {STROKE_WIDTHS.map((sw) => (
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
                      style={{
                        width: `${Math.min(12, sw.value * 1.5 + 2)}px`,
                        height: `${Math.min(12, sw.value * 1.5 + 2)}px`
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-1">
                {COLOR_PALETTE.map((c) => (
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

              {/* Paper Background Selector (when no document is loaded) */}
              {!bgDocument && (
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
              )}

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

            {/* Drawing Canvas Area with Absolute High-Precision Container */}
            <div className="flex-1 p-2 sm:p-4 flex items-center justify-center overflow-hidden min-h-0 relative">
              {/* Paper Container */}
              <div
                ref={containerRef}
                className={`w-full h-full rounded-2xl shadow-inner border border-slate-300 dark:border-slate-800 relative overflow-hidden flex items-center justify-center touch-none ${
                  bgDocument
                    ? 'bg-slate-100 dark:bg-slate-950'
                    : paperType === 'dark'
                    ? 'bg-slate-900'
                    : paperType === 'grid'
                    ? 'bg-white bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]'
                    : paperType === 'lines'
                    ? 'bg-white bg-[linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:100%_28px]'
                    : 'bg-white'
                }`}
              >
                {/* Visual Stamp Indicator on Sheet */}
                <div className="absolute top-2 left-3 pointer-events-none opacity-40 text-[10px] font-black uppercase tracking-wider text-slate-500 z-10">
                  {project.name} • {currentUnit?.name || 'Unidad'}
                </div>

                {/* Underlay Image / Photo / PDF Page */}
                {bgDocument && (
                  <img
                    src={bgDocument.dataUrl}
                    alt={bgDocument.name}
                    style={{ opacity: bgDocument.opacity }}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  />
                )}

                {/* Floating Controls Bar for Loaded Document */}
                {bgDocument && (
                  <div className="absolute top-2 left-2 right-2 z-20 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 flex items-center justify-between gap-2 shadow-lg text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="font-bold truncate text-slate-200">
                        Fondo: <span className="text-amber-400">{bgDocument.name}</span>
                      </span>

                      {/* PDF Multi-page navigation */}
                      {bgDocument.totalPages && bgDocument.totalPages > 1 && (
                        <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-slate-700 ml-1">
                          <button
                            type="button"
                            disabled={bgDocument.page! <= 1}
                            onClick={() => handlePdfPageChange(bgDocument.page! - 1)}
                            className="p-0.5 hover:text-amber-400 disabled:opacity-30 touch-target"
                            title="Página anterior"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span>
                            Pág {bgDocument.page} / {bgDocument.totalPages}
                          </span>
                          <button
                            type="button"
                            disabled={bgDocument.page! >= bgDocument.totalPages!}
                            onClick={() => handlePdfPageChange(bgDocument.page! + 1)}
                            className="p-0.5 hover:text-amber-400 disabled:opacity-30 touch-target"
                            title="Página siguiente"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Opacity slider */}
                      <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
                        <Sliders className="w-3 h-3 text-amber-400" />
                        <span>Opacidad:</span>
                        <input
                          type="range"
                          min="0.2"
                          max="1"
                          step="0.1"
                          value={bgDocument.opacity}
                          onChange={(e) =>
                            setBgDocument((prev) =>
                              prev ? { ...prev, opacity: parseFloat(e.target.value) } : null
                            )
                          }
                          className="w-16 accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Remove Background Button */}
                      <button
                        type="button"
                        onClick={() => setBgDocument(null)}
                        className="px-2 py-0.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-colors touch-target"
                        title="Quitar documento de fondo y volver al lienzo limpio"
                      >
                        Quitar fondo
                      </button>
                    </div>
                  </div>
                )}

                {/* The Precision Transparent Drawing Canvas Layer */}
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="cursor-crosshair touch-none select-none block relative z-10"
                  style={{ touchAction: 'none' }}
                />
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                {bgDocument ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Dibujando sobre: {bgDocument.name}
                  </span>
                ) : (
                  <span>Dibujo a mano alzada calibrado al 100% para S-Pen / Apple Pencil</span>
                )}
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
                  Abre la pestaña de lienzo para hacer un dibujo a mano alzada o escribir sobre una foto o plano PDF y guárdalo aquí.
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
                {unitSketches.map((sketch) => (
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
