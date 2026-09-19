import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  ExternalLink,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Layers,
  Check,
  Building,
  Eye,
  Plus
} from 'lucide-react';
import { BlueprintDocument } from '../types';

interface BlueprintViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitName: string;
  projectName: string;
  blueprints: BlueprintDocument[];
  onAddBlueprint: (doc: Omit<BlueprintDocument, 'id' | 'uploadedAt'>) => void;
  onDeleteBlueprint: (docId: string) => void;
}

export function BlueprintViewerModal({
  isOpen,
  onClose,
  unitName,
  projectName,
  blueprints,
  onAddBlueprint,
  onDeleteBlueprint
}: BlueprintViewerModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Add Doc Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<BlueprintDocument['category']>('arquitectura');
  const [newDocType, setNewDocType] = useState<'pdf' | 'cad' | 'image' | 'link'>('pdf');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Zoom and pan state for images
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredDocs = blueprints.filter(doc => {
    if (activeCategory === 'todos') return true;
    return doc.category === activeCategory;
  });

  const activeDoc = blueprints.find(d => d.id === selectedDocId) || (filteredDocs.length > 0 ? filteredDocs[0] : null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(3.5, prev + 0.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.5, prev - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImg = file.type.startsWith('image/');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setNewDocUrl(dataUrl);
        if (!newDocName.trim()) {
          setNewDocName(file.name.replace(/\.[^/.]+$/, ''));
        }
        setNewDocType(isPdf ? 'pdf' : isImg ? 'image' : 'link');
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert('Error al leer el archivo seleccionado');
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocUrl.trim()) return;

    onAddBlueprint({
      name: newDocName.trim(),
      category: newDocCategory,
      type: newDocType,
      url: newDocUrl.trim(),
      cadViewerUrl: newDocType === 'cad' ? newDocUrl.trim() : undefined
    });

    setNewDocName('');
    setNewDocUrl('');
    setIsAddingDoc(false);
    setZoomLevel(1);
  };

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'arquitectura', label: 'Arquitectura' },
    { id: 'estructura', label: 'Estructuras' },
    { id: 'sanitaria', label: 'Sanitaria' },
    { id: 'electrica', label: 'Eléctrica' },
    { id: 'gas', label: 'Gas' },
    { id: 'otro', label: 'Otros' }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 no-print animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[92vh] max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                  Planos y Documentación Técnica
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {unitName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {projectName} • Cotejo de planos e instalaciones en terreno
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingDoc(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all touch-target"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingDoc ? 'Ver Documentos' : 'Agregar Plano'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors touch-target"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] font-bold text-slate-400 dark:text-slate-500 flex-shrink-0">
            {blueprints.length} {blueprints.length === 1 ? 'documento' : 'documentos'}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Viewer Area */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 overflow-hidden flex flex-col items-center justify-center relative">
            {isAddingDoc ? (
              /* Add Document Form Overlay */
              <div className="w-full max-w-md bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 animate-scale-up">
                <h4 className="font-black text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-500" />
                  Cargar Nuevo Plano o Enlace CAD / 3D
                </h4>

                <form onSubmit={handleAddSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Nombre o Identificador del Plano
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Plano Instalación Sanitaria y Desagües"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Especialidad
                      </label>
                      <select
                        value={newDocCategory}
                        onChange={(e) => setNewDocCategory(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        <option value="arquitectura">Arquitectura</option>
                        <option value="estructura">Estructuras</option>
                        <option value="sanitaria">Sanitaria</option>
                        <option value="electrica">Eléctrica</option>
                        <option value="gas">Gas</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Tipo de Formato
                      </label>
                      <select
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      >
                        <option value="pdf">Archivo PDF</option>
                        <option value="image">Imagen (JPG / PNG)</option>
                        <option value="cad">Enlace CAD 3D / DWG</option>
                        <option value="link">Enlace Web / Nube</option>
                      </select>
                    </div>
                  </div>

                  {newDocType === 'cad' || newDocType === 'link' ? (
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Enlace al Visor Web (Autodesk Viewer / ShareCAD / Drive)
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://viewer.autodesk.com/... o enlace compartido"
                        value={newDocUrl}
                        onChange={(e) => setNewDocUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Seleccionar Archivo ({newDocType === 'pdf' ? 'PDF' : 'JPG, PNG'})
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={newDocType === 'pdf' ? 'application/pdf,.pdf' : 'image/*'}
                        onChange={handleFileChange}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                      />
                      {newDocUrl && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                          ✔ Archivo cargado correctamente
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingDoc(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || !newDocName.trim() || !newDocUrl.trim()}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md"
                    >
                      Guardar Documento
                    </button>
                  </div>
                </form>
              </div>
            ) : activeDoc ? (
              /* Active Document Display */
              <div className="w-full h-full flex flex-col">
                {/* Floating controls for active doc */}
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {activeDoc.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {activeDoc.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {activeDoc.type === 'image' && (
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs mr-2">
                        <button
                          onClick={handleZoomIn}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:text-amber-500"
                          title="Acercar (+)"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-mono font-bold px-1 text-slate-500">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                          onClick={handleZoomOut}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:text-amber-500"
                          title="Alejar (-)"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleResetZoom}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:text-amber-500"
                          title="Restablecer (100%)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <a
                      href={activeDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 hover:text-amber-500 shadow-xs"
                      title="Abrir en pantalla completa o visor externo"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>

                    <button
                      onClick={() => onDeleteBlueprint(activeDoc.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors ml-1"
                      title="Eliminar este plano"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Viewer Canvas / Frame */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-auto flex items-center justify-center relative p-2">
                  {activeDoc.type === 'pdf' ? (
                    <iframe
                      src={activeDoc.url}
                      title={activeDoc.name}
                      className="w-full h-full rounded-lg border-0"
                    />
                  ) : activeDoc.type === 'image' ? (
                    <div className="w-full h-full overflow-auto flex items-center justify-center">
                      <img
                        src={activeDoc.url}
                        alt={activeDoc.name}
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'center center',
                          transition: 'transform 0.15s ease-out'
                        }}
                        className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing rounded shadow"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Compass className="w-16 h-16 text-amber-500 mx-auto mb-3" />
                      <h5 className="font-black text-slate-900 dark:text-white text-base">
                        Modelo CAD / 3D Externo
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        Este archivo está configurado para visualizarse en la plataforma CAD 3D de alta precisión.
                      </p>
                      <a
                        href={activeDoc.cadViewerUrl || activeDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Abrir en Visor CAD 3D (Autodesk / ShareCAD)</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="text-center p-8">
                <Compass className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h5 className="font-black text-slate-700 dark:text-slate-300 text-sm">
                  Sin planos registrados en esta sección
                </h5>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Puedes adjuntar planos en formato PDF, imágenes de planos o enlaces CAD 3D.
                </p>
                <button
                  onClick={() => setIsAddingDoc(true)}
                  className="mt-3 px-3 py-1.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cargar Primer Plano</span>
                </button>
              </div>
            )}
          </div>

          {/* Lateral Document List / Thumbnails */}
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 overflow-y-auto flex-shrink-0">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Índice de Planos ({filteredDocs.length})
            </h5>

            {filteredDocs.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-600 italic">No hay planos para mostrar</p>
            ) : (
              <div className="space-y-2">
                {filteredDocs.map(doc => {
                  const isSelected = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setIsAddingDoc(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-slate-900 dark:text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                          {doc.type === 'pdf' ? (
                            <FileText className="w-4 h-4" />
                          ) : doc.type === 'image' ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <Compass className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate leading-tight">
                            {doc.name}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {doc.category || 'General'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
