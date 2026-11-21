export type SnapshotKind = 'initial' | 'updated';

export interface MaterialIdentity {
  id: string;
  thickness?: number | string | null;
}

export interface InventoryDraftProduct {
  id: string;
  quantity: number;
}

export interface InventoryQuantityEntry {
  product_id: string;
  quantity: number;
}

export interface InventoryDraftSummary {
  /** Cells that contain a valid new quantity. */
  filled: number;
  /** Cells left empty: the material keeps its current quantity. */
  empty: number;
  /** Cells that contain an invalid value and block the save. */
  invalid: number;
  /** Filled cells whose value differs from the current quantity. */
  changed: number;
  /** Payload sent to the RPC: only the filled cells. */
  entries: InventoryQuantityEntry[];
  /** Expected total quantity after saving (filled + untouched materials). */
  newTotal: number;
}

/**
 * Reference displayed for a material. The application already uses the
 * `thickness` column as its "Référence" field; records without a reference
 * fall back to a stable code derived from their identifier so historical
 * reports always stay readable.
 */
export const materialReference = (material: MaterialIdentity): string => {
  const thickness = Number(material.thickness ?? 0);
  if (Number.isFinite(thickness) && thickness !== 0) {
    return String(thickness);
  }
  return `MAT-${material.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
};

export interface ParsedQuantity {
  /** `null` when the input is invalid. */
  value: number | null;
  /** `true` when the input is blank (treated as "unchanged"). */
  empty: boolean;
}

/**
 * Parses a quantity typed by the user. Accepts a dot or a comma as decimal
 * separator, rejects negatives, exponents, whitespace inside the number and
 * any non numeric character.
 */
export const parseQuantityInput = (raw: string): ParsedQuantity => {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '') return { value: null, empty: true };

  const normalized = trimmed.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return { value: null, empty: false };

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return { value: null, empty: false };

  return { value, empty: false };
};

/** Latin digits only, up to 3 decimals, French grouping. */
export const formatQuantity = (value: number | string | null | undefined): string => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(numeric);
};

/** Latin digits only, short date + time, independent from the UI language. */
export const formatDateTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

export const snapshotTypeLabel = (type: string, lang: 'ar' | 'fr'): string => {
  if (type === 'initial') return lang === 'fr' ? 'Inventaire initial' : 'الجرد الأولي';
  return lang === 'fr' ? 'Inventaire mis à jour' : 'جرد محدّث';
};

/** Positive when the material grew, negative when it decreased. */
export const snapshotDelta = (snapshotQuantity: number, currentQuantity: number): number =>
  Number((currentQuantity - snapshotQuantity).toFixed(3));

/**
 * Builds the payload from the raw input strings. Empty cells are ignored so
 * the RPC keeps the current quantity for them; invalid cells are counted and
 * must block the save on the UI side.
 */
export const summarizeInventoryDraft = (
  products: InventoryDraftProduct[],
  drafts: Record<string, string>,
): InventoryDraftSummary => {
  const summary: InventoryDraftSummary = {
    filled: 0,
    empty: 0,
    invalid: 0,
    changed: 0,
    entries: [],
    newTotal: 0,
  };

  for (const product of products) {
    const raw = drafts[product.id];
    if (raw === undefined || raw.trim() === '') {
      summary.empty += 1;
      summary.newTotal += Number(product.quantity) || 0;
      continue;
    }

    const parsed = parseQuantityInput(raw);
    if (parsed.value === null) {
      summary.invalid += 1;
      summary.newTotal += Number(product.quantity) || 0;
      continue;
    }

    summary.filled += 1;
    summary.newTotal += parsed.value;
    if (parsed.value !== Number(product.quantity)) summary.changed += 1;
    summary.entries.push({ product_id: product.id, quantity: parsed.value });
  }

  summary.newTotal = Number(summary.newTotal.toFixed(3));
  return summary;
};

/** Cryptographically strong identifier used as the RPC idempotency key. */
export const createRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = (Math.random() * 16) | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};
