import React, { useRef } from 'react';
import { FileText, ArrowLeft, Sun, Moon, Cloud, CloudOff, RefreshCw, AlertCircle, Building2 } from 'lucide-react';
import { ViewMode, Project, Unit } from '../types';
import { compressImageFile } from '../utils/calculations';
import { CloudSyncStatus } from '../lib/supabase';
import { DEFAULT_LOGO_URL } from '../data/initialData';

interface HeaderProps {
  currentView: ViewMode;
  selectedProject: Project | null;
  selectedUnit: Unit | null;
  unitProgress: number;
  logoUrl: string;
  onNavigate: (view: ViewMode) => void;
  onBack: () => void;
  onOpenLogoEditor?: () => void;
  onOpenReportModal: (type?: 'auto' | 'project' | 'unit') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onLogoChange?: (newUrl: string) => void;
  cloudStatus?: CloudSyncStatus;
  onOpenCloudSetup?: () => void;
}

export function Header({
  currentView,
  selectedProject,
  selectedUnit,
  unitProgress,
  logoUrl,
  onNavigate,
  onBack,
  onOpenLogoEditor,
  onOpenReportModal,
  theme = 'light',
  onToggleTheme,
  onLogoChange,
  cloudStatus,
  onOpenCloudSetup
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 400, 0.85);
      if (onLogoChange) {
        onLogoChange(compressed);
      }
    } catch (err) {
      console.error('Error al procesar logotipo:', err);
    }
    e.target.value = '';
  };

  return (
    <>
      <header className="bg-slate-900 text-white border-b-2 border-amber-500 sticky top-0 z-40 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          {/* Left: Interactive Logo + CONTROL DE AVANCE */}
          <div className="flex items-center space-x-3">
            {/* Logo Touch Trigger */}
            <div
              className="relative group cursor-pointer select-none"
              onClick={handleLogoClick}
              onContextMenu={(e) => {
                if (onOpenLogoEditor) {
                  e.preventDefault();
                  onOpenLogoEditor();
                }
              }}
              title="Cargar o cambiar logotipo desde los archivos de tu dispositivo"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-950/80 p-1 border-2 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)] flex-shrink-0 flex items-center justify-center hover:border-emerald-400 active:scale-95 transition-all">
                <img
                  src={logoUrl || DEFAULT_LOGO_URL}
                  alt="Control de Avance Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
                  }}
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Brand Title with Active Complex Name */}
            <div className="cursor-pointer select-none" onClick={() => onNavigate('dashboard')}>
              <h1 className="font-black tracking-wider text-sm sm:text-base leading-none text-white uppercase">
                CONTROL DE AVANCE
              </h1>
              {selectedProject && currentView !== 'dashboard' && (
                <div className="text-[11px] sm:text-xs font-bold text-amber-400 truncate max-w-[200px] sm:max-w-[340px] flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-amber-400 inline-block flex-shrink-0" />
                  <span className="truncate">{selectedProject.name}</span>
                  {currentView === 'checklist' && selectedUnit && (
                    <>
                      <span className="text-slate-400 font-normal">›</span>
                      <span className="text-white truncate font-extrabold">{selectedUnit.name}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Cloud Sync Status + Theme Toggle */}
          <div className="flex items-center gap-2">
            {cloudStatus && (
              <button
                type="button"
                onClick={onOpenCloudSetup}
                title={
                  cloudStatus === 'synced'
                    ? 'Nube Supabase: Conectado y Sincronizado'
                    : cloudStatus === 'syncing'
                    ? 'Nube Supabase: Sincronizando datos...'
                    : cloudStatus === 'needs_setup'
                    ? 'Nube Supabase: Toca aquí para ver cómo activar la tabla'
                    : 'Nube Supabase: Modo Local'
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all select-none touch-target ${
                  cloudStatus === 'synced'
                    ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/40 hover:bg-emerald-950/70 cursor-pointer'
                    : cloudStatus === 'syncing'
                    ? 'text-amber-400 bg-amber-950/50 border border-amber-500/40'
                    : cloudStatus === 'needs_setup'
                    ? 'text-amber-300 bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 cursor-pointer animate-pulse'
                    : 'text-slate-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 cursor-pointer'
                }`}
              >
                {cloudStatus === 'synced' && <Cloud className="w-3.5 h-3.5 text-emerald-400" />}
                {cloudStatus === 'syncing' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                {cloudStatus === 'needs_setup' && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                {cloudStatus === 'offline' && <CloudOff className="w-3.5 h-3.5 text-slate-400" />}
                <span className="text-[10px] hidden sm:inline">
                  {cloudStatus === 'synced' && 'Nube Conectada'}
                  {cloudStatus === 'syncing' && 'Guardando...'}
                  {cloudStatus === 'needs_setup' && 'Configurar Nube'}
                  {cloudStatus === 'offline' && 'Modo Local'}
                </span>
              </button>
            )}

            {/* Theme Toggle - Compact & Discreet */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
                title={theme === 'dark' ? 'Modo Oscuro activo (clic para Modo Claro)' : 'Modo Claro activo (clic para Modo Oscuro)'}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer flex items-center p-0.5 select-none ${
                  theme === 'dark'
                    ? 'bg-slate-800 border border-slate-700 shadow-inner'
                    : 'bg-slate-200/90 border border-slate-300 shadow-inner'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shadow transition-transform duration-200 ease-in-out ${
                    theme === 'dark'
                      ? 'translate-x-5 bg-slate-900 text-indigo-300 border border-indigo-400/40'
                      : 'translate-x-0 bg-white text-amber-500 border border-amber-300/80 shadow-xs'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Moon className="w-3 h-3 fill-indigo-300" />
                  ) : (
                    <Sun className="w-3 h-3 fill-amber-500" />
                  )}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic header contextual progress bar */}
        {currentView !== 'dashboard' && (
          <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
            <div
              className="h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 transition-all duration-300"
              style={{ width: `${unitProgress}%` }}
            />
          </div>
        )}
      </header>

      {/* Breadcrumb Sub-Header for internal navigation */}
      {currentView !== 'dashboard' && (
        <div className="bg-slate-950 border-b border-slate-800 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 text-xs text-slate-300 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-amber-400 font-bold touch-target py-1 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>{currentView === 'checklist' ? 'Departamentos' : 'Obras'}</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenReportModal(currentView === 'checklist' ? 'unit' : 'project')}
                className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-bold flex items-center gap-1"
              >
                <FileText className="w-3 h-3 text-rose-400" /> Exportar PDF
              </button>
              <div className="font-extrabold text-white truncate max-w-[280px] sm:max-w-none text-right flex items-center gap-1.5">
                <span className="text-amber-400 font-bold truncate max-w-[140px] sm:max-w-[200px]">{selectedProject?.name}</span>
                {currentView === 'checklist' && selectedUnit && (
                  <>
                    <span className="text-slate-400 font-normal">›</span>
                    <span className="text-white font-black truncate max-w-[140px] sm:max-w-[200px]">{selectedUnit.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
