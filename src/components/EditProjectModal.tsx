import React, { useState, useEffect } from 'react';
import { X, Building2, FileCheck, Calendar, FileText, MapPin, Zap, Droplets, Save } from 'lucide-react';
import { Project } from '../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSaveProject: (updatedData: Partial<Project>) => void;
}

export function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSaveProject
}: EditProjectModalProps) {
  const [name, setName] = useState(project.name || '');
  const [location, setLocation] = useState(project.location || '');
  const [expedienteMunicipal, setExpedienteMunicipal] = useState(project.expedienteMunicipal || '');
  const [expedienteEdemsa, setExpedienteEdemsa] = useState(project.expedienteEdemsa || '');
  const [expedienteAysam, setExpedienteAysam] = useState(project.expedienteAysam || '');
  const [startDate, setStartDate] = useState(project.startDate || project.createdAt?.split('T')[0] || '');
  const [estimatedEndDate, setEstimatedEndDate] = useState(project.estimatedEndDate || '');
  const [technicalNotes, setTechnicalNotes] = useState(project.technicalNotes || '');

  useEffect(() => {
    setName(project.name || '');
    setLocation(project.location || '');
    setExpedienteMunicipal(project.expedienteMunicipal || '');
    setExpedienteEdemsa(project.expedienteEdemsa || '');
    setExpedienteAysam(project.expedienteAysam || '');
    setStartDate(project.startDate || project.createdAt?.split('T')[0] || '');
    setEstimatedEndDate(project.estimatedEndDate || '');
    setTechnicalNotes(project.technicalNotes || '');
  }, [project]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveProject({
      name: name.trim(),
      location: location.trim(),
      expedienteMunicipal: expedienteMunicipal.trim(),
      expedienteEdemsa: expedienteEdemsa.trim(),
      expedienteAysam: expedienteAysam.trim(),
      startDate: startDate || undefined,
      estimatedEndDate: estimatedEndDate || undefined,
      technicalNotes: technicalNotes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 no-print animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-5 shadow-2xl border-t-4 border-amber-500 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                Ficha Técnica y Administrativa
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Edición de expedientes, suministros y memoria técnica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Nombre y Ubicación */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Nombre del Edificio / Complejo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Torre Los Ceibos II"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Ubicación o Dirección
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Av. San Martín 1540 • Ciudad"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Expedientes y Suministros */}
          <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Expedientes y Servicios
            </span>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                Expediente Municipal / Permiso de Obra
              </label>
              <input
                type="text"
                value={expedienteMunicipal}
                onChange={(e) => setExpedienteMunicipal(e.target.value)}
                placeholder="Ej: Expte. Nº 14.892-O-2025 (Mun. Capital)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Suministro EDEMSA
                </label>
                <input
                  type="text"
                  value={expedienteEdemsa}
                  onChange={(e) => setExpedienteEdemsa(e.target.value)}
                  placeholder="Cuenta / NIC 284910"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  Suministro AYSAM
                </label>
                <input
                  type="text"
                  value={expedienteAysam}
                  onChange={(e) => setExpedienteAysam(e.target.value)}
                  placeholder="Cuenta 4910-2391"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Plazos de Ejecución */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Fecha Fin Prevista
              </label>
              <input
                type="date"
                value={estimatedEndDate}
                onChange={(e) => setEstimatedEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Notas Técnicas / Memoria Descriptiva */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Notas Técnicas / Memoria Descriptiva
            </label>
            <textarea
              rows={3}
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              placeholder="Especificaciones estructurales, contratistas principales, observaciones relevantes..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs leading-relaxed"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs touch-target"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md touch-target active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Ficha Técnica</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
