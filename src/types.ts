export interface InspectionPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
}

export interface InspectionItem {
  id: string;
  name: string;
  completed: boolean;
  progressPercentage?: number; // 0 to 100
  photos: InspectionPhoto[];
  comment?: string;
  severity?: 'low' | 'medium' | 'high'; // Leve | Medio | Crítico
}

export interface Trade {
  id: string;
  name: string;
  shortName?: string;
  icon: string;
  color: string;
  items: InspectionItem[];
}

export interface BlueprintDocument {
  id: string;
  name: string;
  type: 'pdf' | 'cad' | 'image' | 'link';
  url: string; // Base64 dataURL, blob, or web URL
  size?: number;
  uploadedAt: string;
  category?: 'arquitectura' | 'estructura' | 'sanitaria' | 'electrica' | 'gas' | 'otro';
  cadViewerUrl?: string; // Link to external CAD/BIM viewer like Autodesk Viewer, ShareCAD, etc.
}

export interface FloorConfig {
  floorNumber: number; // 0 for PB, 1 for Piso 1, etc.
  floorLabel: string; // "Planta Baja", "Piso 1", etc.
  unitsCount: number; // Number of units on this floor
}

export interface SketchDocument {
  id: string;
  title: string;
  dataUrl: string; // PNG Data URL of the croquis with technical header
  createdAt: string;
  unitId?: string;
  unitName?: string;
  projectId?: string;
  projectName?: string;
  notes?: string;
}

export interface Unit {
  id: string;
  name: string;
  trades: Trade[];
  type?: 'unit' | 'common_area';
  category?: string;
  floorNumber?: number;
  floorLabel?: string;
  blueprints?: BlueprintDocument[];
  signature?: string; // Base64 dataURL of digital signature
  signedBy?: string; // Signatory full name
  signRole?: string; // Signatory role/cargo
  signDni?: string; // ID / License
  signedAt?: string; // Timestamp
  isLocked?: boolean; // Frozen/locked state
  sketches?: SketchDocument[]; // Registered hand-drawn croquis
}

export interface Milestone {
  id: string;
  name: string;
  startDate?: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD (fecha límite o fin estimada)
  endDate?: string; // alias para compatibilidad
  buildingPart?: string; // e.g. 'Subsuelo', 'Planta Baja', 'Piso 1', 'Fachada', 'Estructura Global', etc.
  tradeCategory?: string; // e.g. 'Albañilería', 'Estructura', o nuevo rubro personalizado
  progressPercentage?: number; // 0 a 100: avance físico directo
  linkType?: 'item' | 'trade' | 'direct';
  linkedTradeId?: string;
  linkedItemName?: string; // specific item title, or blank for all trade
  minPercentageRequired?: number; // default 100
  manualCompleted?: boolean;
  notes?: string;
}

export interface ProjectCustomService {
  id: string;
  name: string;
  number: string;
}

export type CalendarEventType = 'task' | 'alarm' | 'event';
export type PMTaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed';

export interface PMSubtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface ProjectManagerAlarms {
  isOverdueStart: boolean; // Tarea que debía haber iniciado y sigue pendiente
  isUpcomingDeadline: boolean; // Cierre próximo (vence en 72 hs o menos)
  isCriticalDelay: boolean; // Superó la fecha límite y sigue incompleta
  daysOverdue: number; // Días de retraso (si vencida)
  daysUntilDeadline: number; // Días restantes hasta el cierre
}

export interface ProjectCalendarEvent {
  id: string;
  projectId: string; // Garantiza vinculación exclusiva a cada obra
  title: string;
  description?: string;
  date: string; // Formato YYYY-MM-DD (fecha límite o fecha de evento)
  startDate?: string; // Formato YYYY-MM-DD (fecha de inicio programada)
  time?: string; // Formato HH:mm
  type: CalendarEventType; // 'task' (Tarea técnica) | 'alarm' (Alarma / Vencimiento) | 'event' (Evento / Reunión)
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // Baja, Media, Alta, Urgente
  status?: PMTaskStatus; // 'pending' | 'in_progress' | 'blocked' | 'completed'
  completed?: boolean;
  assignedTo?: string; // Responsable o encargado de la tarea
  assignedRole?: string; // Rol o especialidad del responsable (ej. "Director de Obra", "Capataz", "Instalador")
  subtasks?: PMSubtask[]; // Subtareas interactivas con checklist
  category?: string; // Rubro o especialidad
  color?: string;
  createdAt?: string;
  updatedAt?: string; // Timestamp ISO para sincronización multi-dispositivo determinista
}

export type ProjectManagerTask = ProjectCalendarEvent;

export interface Project {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  startDate?: string;
  estimatedEndDate?: string;
  expedienteMunicipal?: string;
  expedienteEdemsa?: string;
  expedienteAysam?: string;
  technicalNotes?: string;
  director?: string; // Msc. Arq. o Director de Obra
  computoSubtitle?: string; // Especialidad o Cómputo y Certificaciones
  floorsConfig?: FloorConfig[];
  customServices?: ProjectCustomService[];
  milestones?: Milestone[];
  calendarEvents?: ProjectCalendarEvent[]; // Tareas, eventos y alarmas independientes por obra
  units: Unit[];
}

export interface TradeTemplate {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  items: string[];
}

export interface CustomLogos {
  header: string;
  banner: string;
  appBackground?: string;
  presentationBackground?: string;
}

export interface LocalColors {
  appBackground: string;
  presentationBackground: string;
  neonColor?: string;
}

export type ViewMode = 'dashboard' | 'units' | 'checklist';
export type StatusFilter = 'all' | 'completed' | 'in_progress' | 'pending';
export type TaskFilter = 'all' | 'pending' | 'completed';
