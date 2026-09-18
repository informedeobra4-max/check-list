import { Milestone, Project } from '../types';

export interface MilestoneUnitDetail {
  unitId: string;
  unitName: string;
  unitType?: 'unit' | 'common_area';
  category?: string;
  percentage: number;
  completed: boolean;
}

export type MilestoneStatus = 'alarm_red' | 'warning_yellow' | 'success_green' | 'normal_blue';

export interface MilestoneCalculationResult {
  milestone: Milestone;
  consolidatedProgress: number; // 0 to 100
  minRequired: number;
  totalUnits: number;
  completedUnits: number;
  inProgressUnits: number;
  pendingUnits: number;
  unitsDetail: MilestoneUnitDetail[];
  status: MilestoneStatus;
  statusLabel: string;
  isPulsing: boolean;
  daysRemaining: number;
  isOverdue: boolean;
  targetDateFormatted: string;
}

export function formatTargetDate(dateStr: string): string {
  if (!dateStr) return 'Sin fecha';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      return `${day} ${months[monthIndex] || ''} ${year}`;
    }
  } catch (e) {
    console.error('Error formatting targetDate', e);
  }
  return dateStr;
}

export function calculateMilestoneProgress(
  milestone: Milestone,
  project: Project
): MilestoneCalculationResult {
  const units = project.units || [];
  const totalUnits = units.length;
  const minRequired = milestone.minPercentageRequired ?? 100;

  let totalProgressSum = 0;
  let completedUnits = 0;
  let inProgressUnits = 0;
  let pendingUnits = 0;
  const unitsDetail: MilestoneUnitDetail[] = [];

  units.forEach(unit => {
    let unitPct = 0;
    let isUnitItemCompleted = false;

    if (milestone.linkType === 'item' && milestone.linkedItemName) {
      // Look for specific item name within the linked trade (or all trades if not specified)
      let foundItem = false;
      unit.trades.forEach(trade => {
        if (!milestone.linkedTradeId || trade.id === milestone.linkedTradeId) {
          const it = trade.items.find(i => i.name.trim().toLowerCase() === milestone.linkedItemName!.trim().toLowerCase());
          if (it) {
            foundItem = true;
            unitPct = it.progressPercentage !== undefined
              ? it.progressPercentage
              : (it.completed ? 100 : 0);
            isUnitItemCompleted = it.completed || unitPct === 100;
          }
        }
      });

      // Fallback if item wasn't found by exact name, try partial match
      if (!foundItem) {
        unit.trades.forEach(trade => {
          if (!milestone.linkedTradeId || trade.id === milestone.linkedTradeId) {
            const it = trade.items.find(i => i.name.toLowerCase().includes(milestone.linkedItemName!.toLowerCase()));
            if (it && !foundItem) {
              foundItem = true;
              unitPct = it.progressPercentage !== undefined
                ? it.progressPercentage
                : (it.completed ? 100 : 0);
              isUnitItemCompleted = it.completed || unitPct === 100;
            }
          }
        });
      }
    } else {
      // Whole trade progress across this unit
      const trade = unit.trades.find(t => t.id === milestone.linkedTradeId);
      if (trade && trade.items.length > 0) {
        const tradeSum = trade.items.reduce((acc, it) => {
          const p = it.progressPercentage !== undefined
            ? it.progressPercentage
            : (it.completed ? 100 : 0);
          return acc + p;
        }, 0);
        unitPct = Math.round(tradeSum / trade.items.length);
        isUnitItemCompleted = unitPct >= 100;
      }
    }

    if (isUnitItemCompleted || unitPct === 100) {
      completedUnits++;
    } else if (unitPct > 0) {
      inProgressUnits++;
    } else {
      pendingUnits++;
    }

    totalProgressSum += unitPct;

    unitsDetail.push({
      unitId: unit.id,
      unitName: unit.name,
      unitType: unit.type,
      category: unit.category,
      percentage: unitPct,
      completed: isUnitItemCompleted || unitPct === 100
    });
  });

  const rawConsolidated = totalUnits === 0 ? 0 : Math.round(totalProgressSum / totalUnits);
  const consolidatedProgress = milestone.manualCompleted ? 100 : rawConsolidated;

  // Calculate dates and alarms
  let daysRemaining = 999;
  let isOverdue = false;

  if (milestone.targetDate) {
    const parts = milestone.targetDate.split('-').map(Number);
    if (parts.length === 3) {
      const target = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);
      const today = new Date();
      // Set today to start of day for clean calculation
      today.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isOverdue = daysRemaining < 0;
    }
  }

  let status: MilestoneStatus = 'normal_blue';
  let statusLabel = 'En Fecha';
  let isPulsing = false;

  if (milestone.manualCompleted || consolidatedProgress >= minRequired) {
    status = 'success_green';
    statusLabel = milestone.manualCompleted ? 'Cumplido (Manual)' : 'Cumplido';
    isPulsing = false;
  } else if (isOverdue) {
    status = 'alarm_red';
    statusLabel = consolidatedProgress === 0 ? 'Alarma: No Comenzado (Vencido)' : 'Alarma: Demorado';
    isPulsing = true;
  } else if (daysRemaining <= 5 && consolidatedProgress === 0) {
    status = 'alarm_red';
    statusLabel = 'Alarma: No Comenzado (Urgente)';
    isPulsing = true;
  } else if (daysRemaining <= 15 && consolidatedProgress < minRequired * 0.5) {
    status = 'warning_yellow';
    statusLabel = 'En Riesgo (Bajo Avance)';
    isPulsing = false;
  } else {
    status = 'normal_blue';
    statusLabel = consolidatedProgress > 0 ? `En Curso (${consolidatedProgress}%)` : 'Programado';
    isPulsing = false;
  }

  return {
    milestone,
    consolidatedProgress,
    minRequired,
    totalUnits,
    completedUnits,
    inProgressUnits,
    pendingUnits,
    unitsDetail,
    status,
    statusLabel,
    isPulsing,
    daysRemaining,
    isOverdue,
    targetDateFormatted: formatTargetDate(milestone.targetDate)
  };
}
