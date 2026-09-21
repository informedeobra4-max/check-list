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
  targetDate: string; // YYYY-MM-DD
  linkType: 'item' | 'trade';
  linkedTradeId: string;
  linkedItemName?: string; // specific item title, or blank for all trade
  minPercentageRequired: number; // default 100
  manualCompleted?: boolean;
  notes?: string;
}

export interface ProjectCustomService {
  id: string;
  name: string;
  number: string;
}

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
  floorsConfig?: FloorConfig[];
  customServices?: ProjectCustomService[];
  milestones?: Milestone[];
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

export type ViewMode = 'dashboard' | 'units' | 'checklist';
export type StatusFilter = 'all' | 'completed' | 'in_progress' | 'pending';
export type TaskFilter = 'all' | 'pending' | 'completed';
