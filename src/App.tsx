import React, { useState, useEffect, useRef } from 'react';
import { Building2, DoorOpen, Image as ImageIcon, FileText, Download, ShieldCheck } from 'lucide-react';
import { Project, Unit, ViewMode, CustomLogos, Milestone } from './types';
import { getInitialMockData, DEFAULT_LOGO_URL, createInitialTrades, MASTER_TRADES_TEMPLATE } from './data/initialData';
import { compressImageFile, calculateUnitProgress } from './utils/calculations';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { UnitsView } from './components/UnitsView';
import { ChecklistView } from './components/ChecklistView';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { ReportModal } from './components/ReportModal';
import { LogoEditorModal } from './components/LogoEditorModal';
import { NewProjectModal } from './components/NewProjectModal';
import { NewUnitModal } from './components/NewUnitModal';
import { EditUnitModal } from './components/EditUnitModal';
import { SecurityConfirmModal } from './components/SecurityConfirmModal';
import { MilestonesModal } from './components/MilestonesModal';
import { exportInspectionPlanillaToExcel } from './utils/excelExport';
import { Toast } from './components/Toast';
import { loadCloudData, saveProjectsToCloud, saveLogosToCloud, subscribeToCloudData, CloudSyncStatus } from './lib/supabase';
import { CloudSetupModal } from './components/CloudSetupModal';

const STORAGE_KEY_PROJECTS = 'CONTROL_AVANCE_OBRA_V3';
const STORAGE_KEY_LOGOS = 'CONTROL_AVANCE_LOGOS_V3';
const STORAGE_KEY_THEME = 'theme_preference';

export default function App() {
  // Theme state: Dark & Light Mode support with persistence in localStorage 'theme_preference'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_THEME);
      if (stored === 'dark' || stored === 'light') return stored;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error('Error reading theme preference:', e);
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.error('Error saving theme preference:', e);
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Retrocompatibility check for photos array & upgrade legacy names
          parsed.forEach((p: Project) => {
            p.units?.forEach(u => {
              if (u.name === 'Depto 1-A') u.name = 'Depto 1-1';
              else if (u.name === 'Depto 1-B') u.name = 'Depto 1-2';
              else if (u.name === 'Depto 2-A') u.name = 'Depto 2-1';
              else if (u.name === 'Depto 2-B') u.name = 'Depto 2-2';
              else if (u.name === 'Módulo A-1') u.name = 'Depto 1-1';
              else if (u.name === 'Módulo A-2') u.name = 'Depto 1-2';
              else if (u.name === 'Módulo B-1') u.name = 'Depto 2-1';

              u.trades?.forEach(t => {
                t.items?.forEach(i => {
                  if (!Array.isArray(i.photos)) i.photos = [];
                });
              });
            });

            // Ensure milestones exist if loaded from storage
            if (!p.milestones || p.milestones.length === 0) {
              const initialMock = getInitialMockData().find(m => m.id === p.id);
              if (initialMock && initialMock.milestones) {
                p.milestones = initialMock.milestones;
              } else {
                p.milestones = [];
              }
            }
          });
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading projects from storage:', e);
    }
    return getInitialMockData();
  });

  const [logos, setLogos] = useState<CustomLogos>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOGOS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.header && parsed.banner) return parsed;
      }
    } catch (e) {
      console.error('Error loading logos from storage:', e);
    }
    return {
      header: DEFAULT_LOGO_URL,
      banner: DEFAULT_LOGO_URL
    };
  });

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Modals state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewUnitModalOpen, setIsNewUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);
  const [logoEditorTarget, setLogoEditorTarget] = useState<'header' | 'banner'>('header');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDefaultScope, setReportDefaultScope] = useState<string>('');

  // Milestones modal state
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false);
  const [milestonesProjectId, setMilestonesProjectId] = useState<string | null>(null);

  // Security confirmation modal with PIN 2600
  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    itemType: 'project' | 'unit';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    itemName: '',
    itemType: 'project',
    onConfirm: () => {}
  });

  // Open Milestones Configuration Modal
  const handleOpenMilestonesConfig = (projectId: string) => {
    setMilestonesProjectId(projectId);
    setIsMilestonesModalOpen(true);
  };

  // Save or Update Milestone
  const handleSaveMilestone = (projectId: string, milestone: Milestone) => {
    setProjects(prev => prev.map(proj => {
      if (proj.id !== projectId) return proj;
      const currentList = proj.milestones || [];
      const exists = currentList.some(m => m.id === milestone.id);
      const updated = exists
        ? currentList.map(m => m.id === milestone.id ? milestone : m)
        : [...currentList, milestone];
      return {
        ...proj,
        milestones: updated
      };
    }));
    showToast('Hito crítico guardado con éxito', 'Calendar');
  };

  // Delete Milestone
  const handleDeleteMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev => prev.map(proj => {
      if (proj.id !== projectId) return proj;
      return {
        ...proj,
        milestones: (proj.milestones || []).filter(m => m.id !== milestoneId)
      };
    }));
    showToast('Hito eliminado del cronograma', 'Trash2');
  };

  // Toggle Manual Complete on Milestone
  const handleToggleManualMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev => prev.map(proj => {
      if (proj.id !== projectId) return proj;
      return {
        ...proj,
        milestones: (proj.milestones || []).map(m => {
          if (m.id !== milestoneId) return m;
          const nextManual = !m.manualCompleted;
          return {
            ...m,
            manualCompleted: nextManual
          };
        })
      };
    }));
    showToast('Estado del hito actualizado', 'Check');
  };

  const projectForMilestones = projects.find(p => p.id === (milestonesProjectId || selectedProjectId));

  // Active Photo Lightbox / Camera
  const [activePhotoViewer, setActivePhotoViewer] = useState<{
    tradeId: string;
    itemId: string;
    tradeName: string;
    itemName: string;
  } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIcon, setToastIcon] = useState<string>('Check');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden native camera input ref
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Cloud Sync state (Supabase)
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('syncing');
  const [isCloudSetupModalOpen, setIsCloudSetupModalOpen] = useState(false);
  const isInitialCloudLoadRef = useRef(true);
  const cloudSaveTimerRef = useRef<any>(null);

  // Initial cloud fetch from Supabase
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initCloud() {
      setCloudStatus('syncing');
      try {
        const res = await loadCloudData();
        setCloudStatus(res.status);

        if (res.status === 'synced') {
          if (res.projects && res.projects.length > 0) {
            setProjects(res.projects);
            showToast('Datos cargados desde la Nube Supabase', 'Cloud');
          } else {
            // If cloud is empty, seed it with current local projects
            saveProjectsToCloud(projects);
          }

          if (res.logos) {
            setLogos(res.logos);
          } else {
            saveLogosToCloud(logos);
          }

          // Subscribe to real-time changes
          unsubscribe = subscribeToCloudData(
            (cloudProjects) => {
              setProjects(cloudProjects);
            },
            (cloudLogos) => {
              setLogos(cloudLogos);
            }
          );
        }
      } catch (err) {
        console.error('Error al inicializar la nube:', err);
        setCloudStatus('offline');
      } finally {
        isInitialCloudLoadRef.current = false;
      }
    }

    initCloud();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Persist projects to localStorage and Supabase Cloud
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects to localStorage:', e);
      showToast('Almacenamiento casi lleno. Reduce fotos si es necesario.', 'AlertCircle');
    }

    // Auto-sync to Supabase cloud (debounced 1s)
    if (!isInitialCloudLoadRef.current) {
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
      cloudSaveTimerRef.current = setTimeout(async () => {
        setCloudStatus('syncing');
        const res = await saveProjectsToCloud(projects);
        setCloudStatus(res.status);
      }, 1000);
    }
  }, [projects]);

  // Persist logos to localStorage and Supabase Cloud
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGOS, JSON.stringify(logos));
    } catch (e) {
      console.error('Error saving logos to localStorage:', e);
    }

    if (!isInitialCloudLoadRef.current) {
      saveLogosToCloud(logos).then(res => {
        if (res.status !== 'needs_setup') {
          setCloudStatus(res.status);
        }
      });
    }
  }, [logos]);

  const showToast = (message: string, icon: string = 'Check') => {
    setToastMessage(message);
    setToastIcon(icon);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleUpdateHeaderLogo = (newUrl: string) => {
    setLogos(prev => ({
      ...prev,
      header: newUrl
    }));
    showToast('¡Logotipo actualizado con éxito!', 'Check');
  };

  const handleRetryCloudSync = async () => {
    setCloudStatus('syncing');
    try {
      const res = await loadCloudData();
      setCloudStatus(res.status);
      if (res.status === 'synced') {
        if (res.projects && res.projects.length > 0) {
          setProjects(res.projects);
        } else {
          await saveProjectsToCloud(projects);
        }
        if (res.logos) {
          setLogos(res.logos);
        } else {
          await saveLogosToCloud(logos);
        }
        showToast('¡Nube Supabase conectada con éxito!', 'Check');
      } else if (res.status === 'needs_setup') {
        showToast('Aún no se detectó la tabla app_data. Ejecuta el SQL en Supabase.', 'AlertCircle');
        setIsCloudSetupModalOpen(true);
      }
    } catch (e) {
      setCloudStatus('offline');
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  const selectedUnit = selectedProject?.units.find(u => u.id === selectedUnitId) || null;

  const currentUnitProgress = selectedUnit ? calculateUnitProgress(selectedUnit) : 0;

  // Navigation handlers
  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
    if (view === 'dashboard') {
      setSelectedProjectId(null);
      setSelectedUnitId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedUnitId(null);
    setCurrentView('units');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setCurrentView('checklist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentView === 'checklist') {
      setCurrentView('units');
      setSelectedUnitId(null);
    } else if (currentView === 'units') {
      setCurrentView('dashboard');
      setSelectedProjectId(null);
    }
  };

  const handleGoToUnitsView = () => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
      setSelectedUnitId(null);
      setCurrentView('units');
    } else if (selectedProjectId) {
      setCurrentView('units');
    } else {
      showToast('Primero crea o selecciona una obra', 'AlertCircle');
    }
  };

  // Delete project with security confirmation (PIN 2600)
  const handleRequestDeleteProject = (projectId: string, projectName: string) => {
    setSecurityModal({
      isOpen: true,
      title: 'Eliminar Obra / Complejo',
      itemName: projectName,
      itemType: 'project',
      onConfirm: () => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (selectedProjectId === projectId) {
          setSelectedProjectId(null);
          setSelectedUnitId(null);
          setCurrentView('dashboard');
        }
        showToast(`Obra "${projectName}" eliminada correctamente`, 'Trash2');
      }
    });
  };

  // Delete unit or common space with security confirmation (PIN 2600)
  const handleRequestDeleteUnit = (unitId: string, unitName: string) => {
    setSecurityModal({
      isOpen: true,
      title: 'Eliminar Espacio / Departamento',
      itemName: unitName,
      itemType: 'unit',
      onConfirm: () => {
        setProjects(prev => prev.map(proj => {
          if (proj.id !== selectedProjectId) return proj;
          return {
            ...proj,
            units: proj.units.filter(u => u.id !== unitId)
          };
        }));
        if (selectedUnitId === unitId) {
          setSelectedUnitId(null);
          setCurrentView('units');
        }
        showToast(`"${unitName}" eliminado correctamente`, 'Trash2');
      }
    });
  };

  // Export inspection sheet to Excel (.xlsx)
  const handleExportExcel = (projectId: string, unitId?: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    try {
      exportInspectionPlanillaToExcel(project, unitId);
      const targetName = unitId 
        ? project.units.find(u => u.id === unitId)?.name || 'Unidad'
        : project.name;
      showToast(`Planilla Excel descargada (${targetName})`, 'Check');
    } catch (err) {
      console.error('Error al generar planilla Excel:', err);
      showToast('Error al exportar planilla Excel', 'AlertCircle');
    }
  };

  // Checklist Item Toggle
  const handleToggleItem = (tradeId: string, itemId: string) => {
    setProjects(prev => prev.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        units: proj.units.map(u => {
          if (u.id !== selectedUnitId) return u;
          return {
            ...u,
            trades: u.trades.map(t => {
              if (t.id !== tradeId) return t;
              return {
                ...t,
                items: t.items.map(item => {
                  if (item.id !== itemId) return item;
                  const newCompleted = !item.completed;
                  const newPct = newCompleted ? 100 : 0;
                  showToast(
                    newCompleted ? 'Ítem completado (100%)' : 'Ítem marcado como pendiente (0%)',
                    newCompleted ? 'Check' : 'Clock'
                  );
                  return {
                    ...item,
                    completed: newCompleted,
                    progressPercentage: newPct
                  };
                })
              };
            })
          };
        })
      };
    }));
  };

  // Checklist Item Progress Percentage Update (0 to 100)
  const handleUpdateItemProgress = (tradeId: string, itemId: string, percentage: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(percentage) ? 0 : Math.round(percentage)));
    const isCompleted = clamped === 100;

    setProjects(prev => prev.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        units: proj.units.map(u => {
          if (u.id !== selectedUnitId) return u;
          return {
            ...u,
            trades: u.trades.map(t => {
              if (t.id !== tradeId) return t;
              return {
                ...t,
                items: t.items.map(item => {
                  if (item.id !== itemId) return item;
                  return {
                    ...item,
                    completed: isCompleted,
                    progressPercentage: clamped
                  };
                })
              };
            })
          };
        })
      };
    }));
  };

  // Delete checklist item
  const handleDeleteItem = (tradeId: string, itemId: string) => {
    if (!confirm('¿Eliminar esta tarea del checklist de la unidad?')) return;
    setProjects(prev => prev.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        units: proj.units.map(u => {
          if (u.id !== selectedUnitId) return u;
          return {
            ...u,
            trades: u.trades.map(t => {
              if (t.id !== tradeId) return t;
              return {
                ...t,
                items: t.items.filter(item => item.id !== itemId)
              };
            })
          };
        })
      };
    }));
    showToast('Tarea eliminada', 'Trash2');
  };

  // Add custom checklist item to trade (smart selector: current unit or replicated across selected active projects)
  const handleAddItem = (
    tradeId: string,
    itemName: string,
    scope: 'current_unit' | 'selected_projects' = 'current_unit',
    targetProjectIds: string[] = []
  ) => {
    const templateTrade = MASTER_TRADES_TEMPLATE.find(t => t.id === tradeId);

    const createNewItem = () => ({
      id: `${tradeId}_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: itemName,
      completed: false,
      progressPercentage: 0,
      photos: []
    });

    if (scope === 'current_unit' || targetProjectIds.length === 0) {
      setProjects(prev => prev.map(proj => {
        if (proj.id !== selectedProjectId) return proj;
        return {
          ...proj,
          units: proj.units.map(u => {
            if (u.id !== selectedUnitId) return u;
            const tradeExists = u.trades.some(t => t.id === tradeId);
            const updatedTrades = tradeExists
              ? u.trades.map(t => {
                  if (t.id !== tradeId) return t;
                  return {
                    ...t,
                    items: [...t.items, createNewItem()]
                  };
                })
              : [
                  ...u.trades,
                  {
                    id: tradeId,
                    name: templateTrade?.name || tradeId,
                    shortName: templateTrade?.shortName || tradeId,
                    icon: templateTrade?.icon || 'Wrench',
                    color: templateTrade?.color || 'text-slate-600 bg-slate-50 border-slate-300',
                    items: [createNewItem()]
                  }
                ];

            return {
              ...u,
              trades: updatedTrades
            };
          })
        };
      }));
      showToast(`Tarea agregada en la unidad actual (0%)`, 'Check');
    } else {
      // Replicate to all departments/units of each selected project with 0% initial progress
      const targetSet = new Set(targetProjectIds);
      let totalUnitsAffected = 0;

      setProjects(prev => prev.map(proj => {
        if (!targetSet.has(proj.id)) return proj;
        totalUnitsAffected += proj.units.length;
        return {
          ...proj,
          units: proj.units.map(u => {
            const tradeExists = u.trades.some(t => t.id === tradeId);
            const updatedTrades = tradeExists
              ? u.trades.map(t => {
                  if (t.id !== tradeId) return t;
                  return {
                    ...t,
                    items: [...t.items, createNewItem()]
                  };
                })
              : [
                  ...u.trades,
                  {
                    id: tradeId,
                    name: templateTrade?.name || tradeId,
                    shortName: templateTrade?.shortName || tradeId,
                    icon: templateTrade?.icon || 'Wrench',
                    color: templateTrade?.color || 'text-slate-600 bg-slate-50 border-slate-300',
                    items: [createNewItem()]
                  }
                ];

            return {
              ...u,
              trades: updatedTrades
            };
          })
        };
      }));

      const countObras = targetProjectIds.length;
      showToast(`Ítem replicado en ${countObras} ${countObras === 1 ? 'obra' : 'obras'} (${totalUnitsAffected} unidades)`, 'Layers');
    }
  };

  // Save or remove technical comment / observation on checklist item
  const handleSaveItemComment = (tradeId: string, itemId: string, comment: string) => {
    const trimmed = comment.trim();
    setProjects(prev => prev.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        units: proj.units.map(u => {
          if (u.id !== selectedUnitId) return u;
          return {
            ...u,
            trades: u.trades.map(t => {
              if (t.id !== tradeId) return t;
              return {
                ...t,
                items: t.items.map(item => {
                  if (item.id !== itemId) return item;
                  return {
                    ...item,
                    comment: trimmed ? trimmed : undefined
                  };
                })
              };
            })
          };
        })
      };
    }));

    if (trimmed) {
      showToast('Observación técnica guardada', 'Check');
    } else {
      showToast('Observación eliminada', 'Trash2');
    }
  };

  // Trigger camera for active item
  const handleTriggerCamera = (tradeId: string, itemId: string, tradeName: string, itemName: string) => {
    setActivePhotoViewer({ tradeId, itemId, tradeName, itemName });
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  // Handle camera capture or image selection
  const handlePhotoCaptured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePhotoViewer) return;

    try {
      const compressedDataUrl = await compressImageFile(file, 800, 0.72);
      const now = new Date();
      const dateString = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const timestamp = `${dateString}, ${timeString} hs`;

      const newPhoto = {
        id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        dataUrl: compressedDataUrl,
        timestamp
      };

      setProjects(prev => prev.map(proj => {
        if (proj.id !== selectedProjectId) return proj;
        return {
          ...proj,
          units: proj.units.map(u => {
            if (u.id !== selectedUnitId) return u;
            return {
              ...u,
              trades: u.trades.map(t => {
                if (t.id !== activePhotoViewer.tradeId) return t;
                return {
                  ...t,
                  items: t.items.map(item => {
                    if (item.id !== activePhotoViewer.itemId) return item;
                    return {
                      ...item,
                      photos: [...(item.photos || []), newPhoto]
                    };
                  })
                };
              })
            };
          })
        };
      }));

      showToast('Fotografía adjuntada con éxito', 'Camera');
    } catch (err) {
      console.error('Error processing captured photo:', err);
      showToast('Error al procesar la imagen', 'AlertCircle');
    }
  };

  // Delete photo
  const handleDeletePhoto = (photoId: string) => {
    if (!activePhotoViewer || !confirm('¿Eliminar esta fotografía de la inspección?')) return;
    setProjects(prev => prev.map(proj => {
      if (proj.id !== selectedProjectId) return proj;
      return {
        ...proj,
        units: proj.units.map(u => {
          if (u.id !== selectedUnitId) return u;
          return {
            ...u,
            trades: u.trades.map(t => {
              if (t.id !== activePhotoViewer.tradeId) return t;
              return {
                ...t,
                items: t.items.map(item => {
                  if (item.id !== activePhotoViewer.itemId) return item;
                  return {
                    ...item,
                    photos: (item.photos || []).filter(p => p.id !== photoId)
                  };
                })
              };
            })
          };
        })
      };
    }));
    showToast('Fotografía eliminada', 'Trash2');
  };

  // Create Project
  const handleCreateProject = (name: string, location: string, unitNames: string[]) => {
    const newUnits = unitNames.map((uName, idx) => ({
      id: `unit_${Date.now()}_${idx + 1}`,
      name: uName,
      trades: createInitialTrades()
    }));

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name,
      location: location || 'Obra en ejecución',
      createdAt: new Date().toISOString().split('T')[0],
      units: newUnits
    };

    setProjects(prev => [newProject, ...prev]);
    setIsNewProjectModalOpen(false);
    setSelectedProjectId(newProject.id);
    setSelectedUnitId(null);
    setCurrentView('units');
    showToast(`Obra "${name}" creada con ${newUnits.length} departamentos`, 'Check');
  };

  // Create Unit
  const handleCreateUnit = (unitName: string) => {
    if (!selectedProjectId) return;
    const newUnit = {
      id: `unit_${Date.now()}`,
      name: unitName,
      trades: createInitialTrades()
    };

    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProjectId) return p;
      return {
        ...p,
        units: [...p.units, newUnit]
      };
    }));

    setIsNewUnitModalOpen(false);
    showToast(`Unidad "${unitName}" agregada`, 'Check');
  };

  // Edit Unit Name (Denomination by floor)
  const handleSaveUnitName = (unitId: string, newName: string) => {
    setProjects(prev => prev.map(p => {
      return {
        ...p,
        units: p.units.map(u => {
          if (u.id === unitId) {
            return { ...u, name: newName };
          }
          return u;
        })
      };
    }));
    showToast(`Denominación actualizada a "${newName}"`, 'Check');
  };

  // Update project schedule dates (startDate, estimatedEndDate)
  const handleUpdateProjectDates = (projectId: string, startDate: string, estimatedEndDate: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        startDate,
        estimatedEndDate
      };
    }));
    showToast('Cronograma de obra actualizado', 'Calendar');
  };

  // Reset to Mock Data
  const handleResetData = () => {
    if (confirm('¿Restablecer datos de prueba de ejemplo? Se reiniciarán las obras y fotos de muestra.')) {
      setProjects(getInitialMockData());
      setSelectedProjectId(null);
      setSelectedUnitId(null);
      setCurrentView('dashboard');
      showToast('Datos reiniciados correctamente', 'RotateCcw');
    }
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Control_Avance_Obra_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Respaldo JSON descargado', 'Download');
  };

  // Open Report modal
  const handleOpenReportModal = (type: 'auto' | 'project' | 'unit' = 'auto', projId?: string, unitId?: string) => {
    const pId = projId || selectedProjectId || (projects[0]?.id ?? '');
    const uId = unitId || selectedUnitId;

    if (type === 'unit' && uId) {
      setReportDefaultScope(`unit:${pId}:${uId}`);
    } else if (type === 'project' && pId) {
      setReportDefaultScope(`proj:${pId}`);
    } else if (currentView === 'checklist' && selectedUnitId && selectedProjectId) {
      setReportDefaultScope(`unit:${selectedProjectId}:${selectedUnitId}`);
    } else {
      setReportDefaultScope(`proj:${pId}`);
    }

    setIsReportModalOpen(true);
  };

  // Get current active item for photo viewer
  const activeItem = (() => {
    if (!activePhotoViewer || !selectedProject || !selectedUnit) return null;
    const trade = selectedUnit.trades.find(t => t.id === activePhotoViewer.tradeId);
    return trade?.items.find(i => i.id === activePhotoViewer.itemId) || null;
  })();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col shadow-2xl relative pb-16 transition-colors duration-200">
      {/* Toast Notification */}
      <Toast message={toastMessage} iconName={toastIcon} />

      {/* Hidden Native Camera & Gallery Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCaptured}
        className="hidden"
      />

      {/* Global Header */}
      <Header
        currentView={currentView}
        selectedProject={selectedProject}
        selectedUnit={selectedUnit}
        unitProgress={currentUnitProgress}
        logoUrl={logos.header}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onOpenLogoEditor={() => {
          setLogoEditorTarget('header');
          setIsLogoEditorOpen(true);
        }}
        onOpenReportModal={handleOpenReportModal}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLogoChange={handleUpdateHeaderLogo}
        cloudStatus={cloudStatus}
        onOpenCloudSetup={() => setIsCloudSetupModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        {currentView === 'dashboard' && (
          <DashboardView
            projects={projects}
            bannerLogoUrl={logos.banner}
            onSelectProject={handleSelectProject}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            onOpenLogoEditor={() => {
              setLogoEditorTarget('banner');
              setIsLogoEditorOpen(true);
            }}
            onOpenReportModal={handleOpenReportModal}
            onResetData={handleResetData}
            onRequestDeleteProject={handleRequestDeleteProject}
            onExportExcel={handleExportExcel}
            onOpenMilestonesConfig={handleOpenMilestonesConfig}
            onToggleManualMilestone={handleToggleManualMilestone}
            onUpdateProjectDates={handleUpdateProjectDates}
          />
        )}

        {currentView === 'units' && selectedProject && (
          <UnitsView
            project={selectedProject}
            onSelectUnit={handleSelectUnit}
            onOpenNewUnitModal={() => setIsNewUnitModalOpen(true)}
            onOpenReportModal={handleOpenReportModal}
            onEditUnit={setEditingUnit}
            onRequestDeleteUnit={handleRequestDeleteUnit}
            onRequestDeleteProject={handleRequestDeleteProject}
            onExportExcel={handleExportExcel}
            onOpenMilestonesConfig={handleOpenMilestonesConfig}
            onToggleManualMilestone={handleToggleManualMilestone}
            onUpdateProjectDates={handleUpdateProjectDates}
          />
        )}

        {currentView === 'checklist' && selectedProject && selectedUnit && (
          <ChecklistView
            project={selectedProject}
            unit={selectedUnit}
            allProjects={projects}
            onToggleItem={handleToggleItem}
            onUpdateItemProgress={handleUpdateItemProgress}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onSaveComment={handleSaveItemComment}
            onOpenPhotoViewer={(tradeId, itemId, tradeName, itemName) => {
              setActivePhotoViewer({ tradeId, itemId, tradeName, itemName });
            }}
            onTriggerQuickPhoto={handleTriggerCamera}
            onOpenReportModal={handleOpenReportModal}
            onEditUnit={setEditingUnit}
            onRequestDeleteUnit={handleRequestDeleteUnit}
            onExportExcel={handleExportExcel}
          />
        )}
      </main>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex justify-around items-center z-30 shadow-lg no-print transition-colors">
        <button
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center justify-center font-bold text-[11px] touch-target ${
            currentView === 'dashboard'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span>Proyectos</span>
        </button>

        <button
          onClick={handleGoToUnitsView}
          className={`flex flex-col items-center justify-center font-bold text-[11px] touch-target ${
            currentView === 'units'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <DoorOpen className="w-5 h-5 mb-0.5" />
          <span>Unidades</span>
        </button>

        <button
          onClick={() => {
            setLogoEditorTarget('header');
            setIsLogoEditorOpen(true);
          }}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-700 font-bold text-[11px] touch-target"
        >
          <ImageIcon className="w-5 h-5 mb-0.5" />
          <span>Logos</span>
        </button>

        <button
          onClick={() => handleOpenReportModal('auto')}
          className="flex flex-col items-center justify-center text-slate-700 hover:text-slate-950 font-black text-[11px] touch-target group"
        >
          <FileText className="w-5 h-5 mb-0.5 text-rose-600 group-hover:scale-110 transition-transform" />
          <span className="text-slate-900 font-black">Exportar PDF</span>
        </button>
      </nav>

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <NewUnitModal
        isOpen={isNewUnitModalOpen}
        onClose={() => setIsNewUnitModalOpen(false)}
        onCreateUnit={handleCreateUnit}
      />

      <EditUnitModal
        isOpen={!!editingUnit}
        unit={editingUnit}
        onClose={() => setEditingUnit(null)}
        onSave={handleSaveUnitName}
        onRequestDelete={handleRequestDeleteUnit}
      />

      <PhotoViewerModal
        isOpen={!!activePhotoViewer}
        tradeName={activePhotoViewer?.tradeName || 'Gremio'}
        item={activeItem}
        onClose={() => setActivePhotoViewer(null)}
        onTriggerCamera={() => {
          if (cameraInputRef.current) {
            cameraInputRef.current.value = '';
            cameraInputRef.current.click();
          }
        }}
        onDeletePhoto={handleDeletePhoto}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        projects={projects}
        defaultScope={reportDefaultScope}
        headerLogoUrl={logos.header}
        onClose={() => setIsReportModalOpen(false)}
        onExportJSON={handleExportJSON}
      />

      <LogoEditorModal
        isOpen={isLogoEditorOpen}
        currentLogos={logos}
        initialTarget={logoEditorTarget}
        onClose={() => setIsLogoEditorOpen(false)}
        onSaveLogos={setLogos}
        onShowToast={showToast}
      />

      <SecurityConfirmModal
        isOpen={securityModal.isOpen}
        title={securityModal.title}
        itemName={securityModal.itemName}
        itemType={securityModal.itemType}
        onClose={() => setSecurityModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={securityModal.onConfirm}
      />

      {isMilestonesModalOpen && projectForMilestones && (
        <MilestonesModal
          isOpen={isMilestonesModalOpen}
          project={projectForMilestones}
          onClose={() => setIsMilestonesModalOpen(false)}
          onSaveMilestone={handleSaveMilestone}
          onDeleteMilestone={handleDeleteMilestone}
          onToggleManualMilestone={handleToggleManualMilestone}
        />
      )}

      <CloudSetupModal
        isOpen={isCloudSetupModalOpen}
        onClose={() => setIsCloudSetupModalOpen(false)}
        onRetrySync={handleRetryCloudSync}
      />
    </div>
  );
}
