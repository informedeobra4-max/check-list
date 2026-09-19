import { Unit, Project } from '../types';

export function calculateUnitProgress(unit: Unit, tradeFilter: string = 'all'): number {
  if (!unit || !unit.trades || unit.trades.length === 0) return 0;
  let totalItems = 0;
  let totalProgress = 0;

  unit.trades.forEach(trade => {
    if (tradeFilter === 'all' || trade.id === tradeFilter) {
      trade.items.forEach(item => {
        totalItems++;
        const pct = item.progressPercentage !== undefined
          ? item.progressPercentage
          : (item.completed ? 100 : 0);
        totalProgress += pct;
      });
    }
  });

  if (totalItems === 0) return 0;
  return Math.round(totalProgress / totalItems);
}

export function getUnitItemCounts(unit: Unit, tradeFilter: string = 'all'): { total: number; completed: number; inProgress: number } {
  let total = 0;
  let completed = 0;
  let inProgress = 0;

  if (unit && unit.trades) {
    unit.trades.forEach(trade => {
      if (tradeFilter === 'all' || trade.id === tradeFilter) {
        trade.items.forEach(item => {
          total++;
          const pct = item.progressPercentage !== undefined
            ? item.progressPercentage
            : (item.completed ? 100 : 0);
          if (item.completed || pct === 100) {
            completed++;
          } else if (pct > 0) {
            inProgress++;
          }
        });
      }
    });
  }

  return { total, completed, inProgress };
}

/**
 * Accurately determines whether a unit is a common area (Espacio Común / Sala de Máquinas / etc.)
 * even if older data did not have the `type` field explicitly set.
 */
export function isUnitCommonArea(unit: { name?: string; type?: 'unit' | 'common_area'; category?: string } | null | undefined): boolean {
  if (!unit) return false;
  if (unit.type === 'common_area') return true;
  if (unit.type === 'unit') return false;

  // Fallback checks for legacy or untyped data:
  if (unit.category === 'Espacio Común' || unit.category === 'Espacio Técnico') return true;

  const n = (unit.name || '').toLowerCase();
  // If explicitly designated with depto/departamento/piso, it is a unit
  if (/^depto\b|^departamento\b|^\d+[-_]\d+/.test(n)) {
    return false;
  }

  // Keywords that denote common spaces / service areas
  const commonKeywords = [
    'quincho', 'sum', 'terraza', 'cochera', 'estacionamiento',
    'baulera', 'hall', 'máquina', 'maquina', 'bomba',
    'transformador', 'set', 'palier', 'escalera', 'común', 'comun',
    'lavadero', 'tendedero', 'tablero', 'portón', 'porton', 'fachada',
    'acceso', 'solarium', 'solárium', 'seguridad', 'garita'
  ];

  if (commonKeywords.some(k => n.includes(k))) {
    return true;
  }

  // Common emojis used for common areas
  if (/[🏢🍖🏊🚗📦⚡🚒📐🛡️🌿]/.test(unit.name || '')) {
    return true;
  }

  return false;
}

export function calculateProjectProgress(
  project: Project,
  tradeFilter: string = 'all',
  typeFilter: 'all' | 'unit' | 'common_area' = 'all'
): number {
  if (!project || !project.units || project.units.length === 0) return 0;
  let totalItemsCount = 0;
  let totalProgressSum = 0;

  project.units.forEach(unit => {
    if (!unit || !unit.trades) return;
    const isCommon = isUnitCommonArea(unit);
    if (typeFilter === 'unit' && isCommon) return;
    if (typeFilter === 'common_area' && !isCommon) return;

    unit.trades.forEach(trade => {
      if (tradeFilter === 'all' || trade.id === tradeFilter) {
        trade.items.forEach(item => {
          totalItemsCount++;
          const pct = item.progressPercentage !== undefined
            ? item.progressPercentage
            : (item.completed ? 100 : 0);
          totalProgressSum += pct;
        });
      }
    });
  });

  if (totalItemsCount === 0) return 0;
  return Math.round(totalProgressSum / totalItemsCount);
}

export function getProjectConsolidatedStats(project: Project, tradeFilter: string = 'all'): {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  pendingItems: number;
  totalProgressSum: number;
  globalPercentage: number;
  remainingPercentage: number;
} {
  let totalItems = 0;
  let completedItems = 0;
  let inProgressItems = 0;
  let pendingItems = 0;
  let totalProgressSum = 0;

  if (project && project.units) {
    project.units.forEach(unit => {
      if (!unit || !unit.trades) return;
      unit.trades.forEach(trade => {
        if (tradeFilter === 'all' || trade.id === tradeFilter) {
          trade.items.forEach(item => {
            totalItems++;
            const pct = item.progressPercentage !== undefined
              ? item.progressPercentage
              : (item.completed ? 100 : 0);
            totalProgressSum += pct;
            if (pct >= 100 || item.completed) {
              completedItems++;
            } else if (pct > 0) {
              inProgressItems++;
            } else {
              pendingItems++;
            }
          });
        }
      });
    });
  }

  const globalPercentage = totalItems > 0 ? Math.round(totalProgressSum / totalItems) : 0;
  const remainingPercentage = Math.max(0, 100 - globalPercentage);

  return {
    totalItems,
    completedItems,
    inProgressItems,
    pendingItems,
    totalProgressSum,
    globalPercentage,
    remainingPercentage
  };
}

/**
 * Resizes and compresses an image using HTML5 Canvas to prevent localStorage quota exhaustion.
 */
export function compressImageFile(file: File, maxDim: number = 800, quality: number = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
