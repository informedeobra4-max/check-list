import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Upload, Link as LinkIcon, RotateCcw, Save, ShieldCheck, Palette, Check, Sparkles } from 'lucide-react';
import { CustomLogos } from '../types';
import { DEFAULT_LOGO_URL } from '../data/initialData';
import { compressImageFile, hexToRgba } from '../utils/calculations';

interface LogoEditorModalProps {
  isOpen: boolean;
  currentLogos: CustomLogos;
  localAppBackground?: string;
  localPresentationBackground?: string;
  localNeonColor?: string;
  initialTarget?: 'header' | 'banner';
  onClose: () => void;
  onSaveLogos: (
    logos: CustomLogos,
    localColors?: {
      appBackground: string;
      presentationBackground: string;
      neonColor?: string;
    }
  ) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const NEON_COLOR_PRESETS = [
  { label: 'Cian Neón (Original)', value: '#00f2fe', colorClass: 'bg-[#00f2fe]' },
  { label: 'Verde Esmeralda', value: '#10b981', colorClass: 'bg-[#10b981]' },
  { label: 'Ámbar / Oro Eléctrico', value: '#f59e0b', colorClass: 'bg-[#f59e0b]' },
  { label: 'Azul Eléctrico', value: '#00c2ff', colorClass: 'bg-[#00c2ff]' },
  { label: 'Violeta Cyber', value: '#a855f7', colorClass: 'bg-[#a855f7]' },
  { label: 'Rojo Coral Neón', value: '#f43f5e', colorClass: 'bg-[#f43f5e]' },
  { label: 'Verde Flúor / Lima', value: '#84cc16', colorClass: 'bg-[#84cc16]' },
  { label: 'Fucsia Magenta', value: '#ec4899', colorClass: 'bg-[#ec4899]' }
];

const APP_BG_PRESETS = [
  { label: 'Original', value: '', colorClass: 'bg-slate-900 border-slate-700' },
  { label: 'Pizarra Negra', value: '#020617', colorClass: 'bg-[#020617] border-slate-700' },
  { label: 'Carbón Obra', value: '#0f172a', colorClass: 'bg-[#0f172a] border-slate-700' },
  { label: 'Noche Azul', value: '#09111e', colorClass: 'bg-[#09111e] border-slate-700' },
  { label: 'Verde Bosque', value: '#031a10', colorClass: 'bg-[#031a10] border-slate-700' },
  { label: 'Grafito Zinc', value: '#18181b', colorClass: 'bg-[#18181b] border-slate-700' },
  { label: 'Gris Claro', value: '#f1f5f9', colorClass: 'bg-[#f1f5f9] border-slate-300' },
  { label: 'Blanco Puro', value: '#ffffff', colorClass: 'bg-[#ffffff] border-slate-300' }
];

const PRESENTATION_BG_PRESETS = [
  {
    label: 'Original',
    value: '',
    previewStyle: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #020617 100%)' }
  },
  {
    label: 'Esmeralda',
    value: 'linear-gradient(135deg, #06281e 0%, #0d3d2c 50%, #021a11 100%)',
    previewStyle: { background: 'linear-gradient(135deg, #06281e 0%, #0d3d2c 50%, #021a11 100%)' }
  },
  {
    label: 'Azul Acero',
    value: 'linear-gradient(135deg, #0f2b48 0%, #1e3a5f 50%, #0a192f 100%)',
    previewStyle: { background: 'linear-gradient(135deg, #0f2b48 0%, #1e3a5f 50%, #0a192f 100%)' }
  },
  {
    label: 'Ámbar Ocre',
    value: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #271104 100%)',
    previewStyle: { background: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #271104 100%)' }
  },
  {
    label: 'Cobalto 900',
    value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
    previewStyle: { background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)' }
  },
  {
    label: 'Titanio',
    value: '#18181b',
    previewStyle: { backgroundColor: '#18181b' }
  },
  {
    label: 'Pizarra',
    value: '#020617',
    previewStyle: { backgroundColor: '#020617' }
  },
  {
    label: 'Carbón',
    value: '#0f172a',
    previewStyle: { backgroundColor: '#0f172a' }
  }
];

export function LogoEditorModal({
  isOpen,
  currentLogos,
  localAppBackground = '',
  localPresentationBackground = '',
  localNeonColor = '#00f2fe',
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
  const [appBg, setAppBg] = useState<string>(localAppBackground);
  const [presentationBg, setPresentationBg] = useState<string>(localPresentationBackground);
  const [neonColor, setNeonColor] = useState<string>(localNeonColor || '#00f2fe');

  useEffect(() => {
    if (isOpen) {
      setAppBg(localAppBackground);
      setPresentationBg(localPresentationBackground);
      setNeonColor(localNeonColor || '#00f2fe');
      setTempPreview(initialTarget === 'header' ? currentLogos.header : currentLogos.banner);
    }
  }, [isOpen, localAppBackground, localPresentationBackground, localNeonColor, currentLogos, initialTarget]);

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
    const updatedLogos: CustomLogos = {
      ...currentLogos,
      [target]: tempPreview
    };
    const localColors = {
      appBackground: appBg,
      presentationBackground: presentationBg,
      neonColor: neonColor || '#00f2fe'
    };
    onSaveLogos(updatedLogos, localColors);
    onClose();
    onShowToast('¡Configuración guardada en este equipo!', 'Check');
  };

  const handleResetColors = () => {
    setAppBg('');
    setPresentationBg('');
    setNeonColor('#00f2fe');
    onShowToast('Colores y neón restablecidos a los originales en este dispositivo', 'RotateCcw');
  };

  const handleReset = () => {
    if (confirm('¿Restablecer logotipos y colores al diseño original?')) {
      const resetLogos: CustomLogos = {
        header: DEFAULT_LOGO_URL,
        banner: DEFAULT_LOGO_URL
      };
      setTempPreview(DEFAULT_LOGO_URL);
      setAppBg('');
      setPresentationBg('');
      setNeonColor('#00f2fe');
      onSaveLogos(resetLogos, { appBackground: '', presentationBackground: '', neonColor: '#00f2fe' });
      onClose();
      onShowToast('Logotipos y colores restablecidos al original', 'RotateCcw');
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

        {/* Sector de Personalización de Fondos y Colores de la App y Obras */}
        <div className="mt-5 pt-4 border-t-2 border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <Palette className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Colores & Fondos (Este Dispositivo)
              </h4>
            </div>
            <button
              type="button"
              onClick={handleResetColors}
              className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 transition-colors touch-target"
              title="Restaurar los colores originales en este dispositivo"
            >
              <RotateCcw className="w-3 h-3 text-amber-600" />
              <span>Restaurar colores originales</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mb-3.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block"></span>
            <span>Ajuste exclusivo para este equipo. No modifica los colores de otros celulares ni computadoras.</span>
          </p>

          {/* 1. Fondo de la App */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>1. Color del Fondo de la App</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  {appBg ? appBg : 'Original'}
                </span>
                <label className="w-6 h-6 rounded-full border border-slate-300 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center p-0 relative" title="Seleccionar color personalizado">
                  <input
                    type="color"
                    value={appBg || '#0f172a'}
                    onChange={(e) => setAppBg(e.target.value)}
                    className="w-8 h-8 cursor-pointer opacity-0 absolute"
                  />
                  <span
                    className="w-full h-full rounded-full border border-white"
                    style={{ backgroundColor: appBg || '#0f172a' }}
                  />
                </label>
              </div>
            </div>

            {/* Quick Palette Chips for App Background */}
            <div className="grid grid-cols-4 gap-1.5">
              {APP_BG_PRESETS.map((p) => {
                const isSelected = appBg === p.value;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setAppBg(p.value)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/40 bg-white text-slate-900 shadow-xs font-black'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 border border-slate-400/40 ${p.colorClass}`}
                      style={p.value ? { backgroundColor: p.value } : undefined}
                    />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Fondo de la Presentación de cada Obra */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>2. Fondos de Presentación de Obras</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase truncate max-w-[90px]">
                  {presentationBg ? 'Personalizado' : 'Original'}
                </span>
                <label className="w-6 h-6 rounded-full border border-slate-300 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center p-0 relative" title="Seleccionar color sólido para obras">
                  <input
                    type="color"
                    value={presentationBg && !presentationBg.startsWith('linear') ? presentationBg : '#0f172a'}
                    onChange={(e) => setPresentationBg(e.target.value)}
                    className="w-8 h-8 cursor-pointer opacity-0 absolute"
                  />
                  <span
                    className="w-full h-full rounded-full border border-white"
                    style={presentationBg ? (presentationBg.startsWith('linear') ? { background: presentationBg } : { backgroundColor: presentationBg }) : { background: 'linear-gradient(135deg, #0f172a, #020617)' }}
                  />
                </label>
              </div>
            </div>

            {/* Quick Palette Chips for Presentation Background */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PRESENTATION_BG_PRESETS.map((p) => {
                const isSelected = presentationBg === p.value;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPresentationBg(p.value)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/40 bg-white text-slate-900 shadow-xs font-black'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-md shrink-0 border border-slate-400/40 shadow-xs"
                      style={p.previewStyle}
                    />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Color del Neón Ejecutivo */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>3. Color del Neón (Líneas y Luces de Obras)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  {neonColor ? neonColor : '#00F2FE'}
                </span>
                <label className="w-6 h-6 rounded-full border border-slate-300 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center p-0 relative" title="Seleccionar color de neón libre">
                  <input
                    type="color"
                    value={neonColor || '#00f2fe'}
                    onChange={(e) => setNeonColor(e.target.value)}
                    className="w-8 h-8 cursor-pointer opacity-0 absolute"
                  />
                  <span
                    className="w-full h-full rounded-full border border-white"
                    style={{ backgroundColor: neonColor || '#00f2fe' }}
                  />
                </label>
              </div>
            </div>

            {/* Neon Live Preview Badge */}
            <div
              className="mb-2.5 p-2.5 rounded-xl bg-[#131b2c] border-2 transition-all flex items-center justify-between shadow-md"
              style={{
                borderColor: neonColor || '#00f2fe',
                boxShadow: `0 0 16px ${hexToRgba(neonColor || '#00f2fe', 0.4)}`
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{
                    backgroundColor: neonColor || '#00f2fe',
                    boxShadow: `0 0 8px ${neonColor || '#00f2fe'}`
                  }}
                />
                <span className="text-xs font-black text-white">Vista previa del borde neón</span>
              </div>
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border"
                style={{
                  color: neonColor || '#00f2fe',
                  borderColor: hexToRgba(neonColor || '#00f2fe', 0.4),
                  backgroundColor: hexToRgba(neonColor || '#00f2fe', 0.15)
                }}
              >
                Iluminado
              </span>
            </div>

            {/* Quick Palette Chips for Neon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {NEON_COLOR_PRESETS.map((p) => {
                const isSelected = (neonColor || '#00f2fe').toLowerCase() === p.value.toLowerCase();
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setNeonColor(p.value)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/40 bg-white text-slate-900 shadow-xs font-black'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 border border-slate-400/40 shadow-xs ${p.colorClass}`}
                      style={{
                        backgroundColor: p.value,
                        boxShadow: `0 0 8px ${hexToRgba(p.value, 0.6)}`
                      }}
                    />
                    <span className="truncate">{p.label.split(' ')[0]}</span>
                  </button>
                );
              })}
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
