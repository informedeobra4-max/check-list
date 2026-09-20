import React, { useState } from 'react';
import { X, Image as ImageIcon, Upload, Link as LinkIcon, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { CustomLogos } from '../types';
import { DEFAULT_LOGO_URL } from '../data/initialData';
import { compressImageFile } from '../utils/calculations';

interface LogoEditorModalProps {
  isOpen: boolean;
  currentLogos: CustomLogos;
  initialTarget?: 'header' | 'banner';
  onClose: () => void;
  onSaveLogos: (logos: CustomLogos) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export function LogoEditorModal({
  isOpen,
  currentLogos,
  initialTarget = 'header',
  onClose,
  onSaveLogos,
  onShowToast
}: LogoEditorModalProps) {
  const [target, setTarget] = useState<'header' | 'banner'>(initialTarget);
  const [tempPreview, setTempPreview] = useState<string>(
    initialTarget === 'header' ? currentLogos.header : currentLogos.banner
  );
  const [urlInput, setUrlInput] = useState<string>('');

  if (!isOpen) return null;

  const handleTargetChange = (newTarget: 'header' | 'banner') => {
    setTarget(newTarget);
    setTempPreview(newTarget === 'header' ? currentLogos.header : currentLogos.banner);
    setUrlInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 400, 0.85);
      setTempPreview(compressed);
      onShowToast('Imagen cargada en vista previa', 'Image');
    } catch (err) {
      onShowToast('Error al cargar la imagen', 'AlertCircle');
    }
  };

  const handleApplyUrl = () => {
    const val = urlInput.trim();
    if (!val) {
      onShowToast('Ingresa una URL válida', 'AlertCircle');
      return;
    }
    setTempPreview(val);
    onShowToast('URL cargada en vista previa', 'Image');
  };

  const handleSave = () => {
    const updated: CustomLogos = {
      ...currentLogos,
      [target]: tempPreview
    };
    onSaveLogos(updated);
    onClose();
    onShowToast('¡Logotipo actualizado con éxito!', 'Check');
  };

  const handleReset = () => {
    if (confirm('¿Restablecer logotipos al diseño original?')) {
      const resetLogos: CustomLogos = {
        header: DEFAULT_LOGO_URL,
        banner: DEFAULT_LOGO_URL
      };
      setTempPreview(DEFAULT_LOGO_URL);
      onSaveLogos(resetLogos);
      onClose();
      onShowToast('Logotipos restablecidos', 'RotateCcw');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border-t-4 border-amber-500 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-none">
                Personalizar Logotipo & Marca
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cambia el logo de la obra o de la empresa
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 touch-target">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Tabs */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            ¿Qué elemento deseas actualizar?
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTargetChange('header')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                target === 'header'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Logo Header</span>
            </button>

            <button
              type="button"
              onClick={() => handleTargetChange('banner')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                target === 'banner'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>Logo Portada</span>
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-4 bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
            Vista Previa
          </span>
          <div className="w-20 h-20 bg-slate-950 rounded-xl p-2 border-2 border-emerald-500 shadow-md shadow-emerald-950/50 flex items-center justify-center overflow-hidden">
            <img
              src={tempPreview || DEFAULT_LOGO_URL}
              alt="Vista previa logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
              }}
            />
          </div>
          <p className="text-[11px] text-slate-300 mt-2 text-center">
            {target === 'header' ? 'Logo en barra superior y PDF' : 'Logo en tarjeta principal de obra'}
          </p>
        </div>

        {/* Upload options */}
        <div className="mt-4 space-y-3">
          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-amber-600" /> 1. Subir archivo desde tu dispositivo
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40 rounded-xl p-3 cursor-pointer transition-colors text-center">
              <Upload className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-xs font-bold text-slate-800">Toca para elegir imagen</span>
              <span className="text-[10px] text-slate-500">PNG, JPG, SVG o WebP</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-amber-600" /> 2. O pegar URL de imagen
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://ejemplo.com/logo.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 font-medium"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="bg-slate-900 text-amber-400 px-3 py-2 rounded-xl text-xs font-bold touch-target active:scale-95 border border-amber-500/40"
              >
                Probar
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl touch-target flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Restablecer Original
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl touch-target shadow flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
