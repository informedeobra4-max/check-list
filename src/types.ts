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

export interface Unit {
  id: string;
  name: string;
  trades: Trade[];
  type?: 'unit' | 'common_area';
  category?: string;
  signature?: string; // Base64 dataURL of digital signature
  signedBy?: string; // Signatory full name
  signRole?: string; // Signatory role/cargo
  signDni?: string; // ID / License
  signedAt?: string; // Timestamp
  isLocked?: boolean; // Frozen/locked state
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

export interface Project {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  startDate?: string;
  estimatedEndDate?: string;
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
}

export type ViewMode = 'dashboard' | 'units' | 'checklist';
export type StatusFilter = 'all' | 'completed' | 'in_progress' | 'pending';
export type TaskFilter = 'all' | 'pending' | 'completed';
