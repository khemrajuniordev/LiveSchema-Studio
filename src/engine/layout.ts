import type { Relationship, Table } from '../types/schema';

// ---------------------------------------------------------------------------
// Card geometry — single source of truth shared by FloatingTableCard (which
// renders with these fixed sizes), RelationshipLines (wire anchors) and the
// auto-layout (collision-free stacking).
// ---------------------------------------------------------------------------
export const CARD_WIDTH = 320;
export const CARD_BORDER = 1;          // glass-card outline, on every side
export const CARD_HEADER_HEIGHT = 58;   // includes the 1px bottom border
export const CARD_BODY_PADDING = 8;     // p-2 around the column list
export const CARD_ROW_HEIGHT = 34;
export const CARD_ROW_GAP = 4;          // space-y-1
export const CARD_FOOTER_HEIGHT = 33;   // includes the 1px top border
// Triggers section, between the columns and the footer (below every column anchor)
export const CARD_TRIGGER_PADDING = 6;  // top and bottom, inside the 1px top border
export const CARD_TRIGGER_ROW_HEIGHT = 24;
export const CARD_TRIGGER_WRITES_HEIGHT = 14; // extra line "→ escreve em …"
export const CARD_TRIGGER_ROW_GAP = 2;
const CARD_EMPTY_BODY_HEIGHT = 64;      // "Aguardando definição de colunas..."

/** Vertical center of a column row, relative to the top of its card */
export function columnAnchorY(columnIndex: number): number {
  return (
    CARD_BORDER +
    CARD_HEADER_HEIGHT +
    CARD_BODY_PADDING +
    columnIndex * (CARD_ROW_HEIGHT + CARD_ROW_GAP) +
    CARD_ROW_HEIGHT / 2
  );
}

/** Height of a table card in schema view, based on its column count */
export function calculateTableHeight(table: Table): number {
  const n = table.columns.length;
  const body = n === 0
    ? CARD_EMPTY_BODY_HEIGHT
    : CARD_BODY_PADDING * 2 + n * CARD_ROW_HEIGHT + (n - 1) * CARD_ROW_GAP;
  const t = table.triggers.length;
  const triggers = t === 0
    ? 0
    : 1 + CARD_TRIGGER_PADDING * 2 + (t - 1) * CARD_TRIGGER_ROW_GAP +
      table.triggers.reduce((sum, trg) => sum + triggerRowHeight(trg.writesTo.length > 0), 0);
  return CARD_BORDER * 2 + CARD_HEADER_HEIGHT + body + triggers + CARD_FOOTER_HEIGHT;
}

/** Height of one trigger row; triggers that write to other tables get a second line */
export function triggerRowHeight(hasWrites: boolean): number {
  return CARD_TRIGGER_ROW_HEIGHT + (hasWrites ? CARD_TRIGGER_WRITES_HEIGHT : 0);
}

// Computes non-overlapping positions using hierarchical DAG column packing
export function calculateAutoLayout(
  tables: Table[],
  relationships: Relationship[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (tables.length === 0) return positions;

  const horizontalGap = 90; // Space between columns for relationship wires
  const verticalGap = 50;   // Guaranteed space between stacked tables
  const startX = 60;
  const startY = 60;

  const known = new Set(tables.map((t) => t.name.toLowerCase()));

  // Determine dependency layers based on FKs
  // Tables without FKs (parent entities) go to earlier columns
  const tableLayer = new Map<string, number>();
  tables.forEach((t) => tableLayer.set(t.name.toLowerCase(), 0));

  // Self references and FKs to unknown tables don't affect the layering
  const edges = relationships
    .map((rel) => [rel.sourceTable.toLowerCase(), rel.targetTable.toLowerCase()] as const)
    .filter(([src, tgt]) => src !== tgt && known.has(src) && known.has(tgt));

  // Longest-path layering; capping the layer keeps FK cycles from growing forever
  const maxLayer = tables.length - 1;
  for (let pass = 0; pass < tables.length; pass++) {
    let changed = false;
    edges.forEach(([src, tgt]) => {
      const tgtLayer = tableLayer.get(tgt) ?? 0;
      const srcLayer = tableLayer.get(src) ?? 0;

      // The referencing table (FK) is placed in a column to the right of parent (PK)
      if (srcLayer <= tgtLayer && tgtLayer < maxLayer) {
        tableLayer.set(src, tgtLayer + 1);
        changed = true;
      }
    });
    if (!changed) break;
  }

  // Group tables by layer
  const layers = new Map<number, Table[]>();
  tables.forEach((t) => {
    const layer = tableLayer.get(t.name.toLowerCase()) || 0;
    if (!layers.has(layer)) layers.set(layer, []);
    layers.get(layer)!.push(t);
  });

  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b);

  let currentX = startX;

  sortedLayerKeys.forEach((layerKey) => {
    const colTables = layers.get(layerKey) || [];
    let currentY = startY;

    colTables.forEach((table) => {
      positions.set(table.id.toLowerCase(), { x: currentX, y: currentY });
      // Advance Y position with guaranteed margin so tables never overlap
      currentY += calculateTableHeight(table) + verticalGap;
    });

    currentX += CARD_WIDTH + horizontalGap;
  });

  return positions;
}

// Fallback position for a table the user hasn't placed yet
export function calculateDefaultPosition(index: number, total: number) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
  const col = index % cols;
  const row = Math.floor(index / cols);

  const startX = 60;
  const startY = 60;
  const spacingX = 410;
  const spacingY = 460;

  return {
    x: startX + col * spacingX,
    y: startY + row * spacingY,
  };
}
