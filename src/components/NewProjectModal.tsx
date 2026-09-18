import React, { useState } from 'react';
import { X, Building2, Layers, Sparkles, Hash } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, location: string, unitNames: string[]) => void;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreateProject
}: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [mode, setMode] = useState<'floors' | 'manual'>('floors');
  const [floorsCount, setFloorsCount] = useState<number>(3);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number>(4);
  const [manualCount, setManualCount] = useState<number>(4);
  const [prefix, setPrefix] = useState('Depto');

  if (!isOpen) return null;

  // Generate list of names according to configuration
  const generateUnitNames = (): string[] => {
    const list: string[] = [];
    if (mode === 'floors') {
      const floors = Math.max(1, Math.min(50, floorsCount));
      const units = Math.max(1, Math.min(30, unitsPerFloor));
      for (let f = 1; f <= floors; f++) {
        for (let u = 1; u <= units; u++) {
          const pref = prefix.trim() ? `${prefix.trim()} ` : '';
          list.push(`${pref}${f}-${u}`);
        }
      }
    } else {
      const count = Math.max(1, Math.min(100, manualCount));
      for (let i = 1; i <= count; i++) {
        const floor = Math.ceil(i / 2);
        const unit = i % 2 === 1 ? 1 : 2;
        const pref = prefix.trim() ? `${prefix.trim()} ` : '';
        list.push(`${pref}${floor}-${unit}`);
      }
    }
    return list;
  };

  const previewNames = generateUnitNames();
  const totalUnits = previewNames.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const names = generateUnitNames();
    onCreateProject(name.trim(), location.trim(), names);
    setName('');
    setLocation('');
    setFloorsCount(3);
    setUnitsPerFloor(4);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border-t-4 border-amber-500 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                Crear Nueva Obra
              </h3>
              <p className="text-[11px] text-slate-500">
                Configuración por pisos y departamentos
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 touch-target">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre del Edificio / Obra
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Torre Los Ceibos II"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ubicación o Detalle
            </label>
            <input
              type="text"
              placeholder="Ej: Sector Norte, Bloque B • Av. Libertador 4500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50 font-medium"
            />
          </div>

          {/* Mode Selector */}
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Estructura de Departamentos</span>
              <span className="text-[10px] text-amber-600 font-black uppercase">
                {totalUnits} Unidades en total
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('floors')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  mode === 'floors'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Por Pisos (1-1, 1-2...)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  mode === 'manual'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hash className="w-3.5 h-3.5 text-amber-600" />
                <span>Cantidad Simple</span>
              </button>
            </div>
          </div>

          {/* Configuration Inputs */}
          {mode === 'floors' ? (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cantidad de Pisos
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={floorsCount}
                    onChange={(e) => setFloorsCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block text-center">
                    Piso 1 al {floorsCount}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deptos por Piso
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={unitsPerFloor}
                    onChange={(e) => setUnitsPerFloor(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block text-center">
                    ej: 1 al {unitsPerFloor}
                  </span>
                </div>
              </div>

              {/* Prefix Selector */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80">
                <span className="text-slate-600 font-medium">Prefijo de denominación:</span>
                <div className="flex gap-1.5">
                  {['Depto', 'Unidad', ''].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrefix(p)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                        prefix === p
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}
                    >
                      {p === '' ? 'Sin prefijo (1-1)' : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formula explanation */}
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium">
                <Sparkles className="w-3 h-3 text-amber-600 inline mr-1" />
                Se generarán <strong>{floorsCount} pisos</strong> con <strong>{unitsPerFloor} deptos cada uno</strong> ({totalUnits} unidades en total).
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cantidad Total de Departamentos
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={manualCount}
                onChange={(e) => setManualCount(parseInt(e.target.value, 10) || 1)}
                className="w-24 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50 font-bold text-center"
              />
            </div>
          )}

          {/* Live Preview of generated unit denomination */}
          <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Vista previa de la denominación generada ({totalUnits} deptos):
            </span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar">
              {previewNames.slice(0, 20).map(nameStr => (
                <span
                  key={nameStr}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono font-bold text-slate-800 shadow-2xs"
                >
                  {nameStr}
                </span>
              ))}
              {previewNames.length > 20 && (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold">
                  +{previewNames.length - 20} más...
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 italic">
              Podrás editar o renombrar cada departamento individualmente en cualquier momento.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm touch-target"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-md touch-target active:scale-95 transition-all"
            >
              Crear Obra ({totalUnits} Deptos)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
