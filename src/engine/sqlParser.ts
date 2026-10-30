import type { Column, ColumnCategory, Relationship, SchemaParseResult, Table } from '../types/schema';

export function categorizeType(rawType: string, isPk: boolean, isFk: boolean): ColumnCategory {
  if (isPk || isFk) return 'key';
  const t = rawType.toLowerCase();
  if (t.includes('serial') || t.includes('uuid')) return 'key';
  if (t.includes('int') || t.includes('float') || t.includes('double') || t.includes('decimal') || t.includes('numeric') || t.includes('real')) {
    return 'numeric';
  }
  if (t.includes('char') || t.includes('text') || t.includes('string')) {
    return 'text';
  }
  if (t.includes('time') || t.includes('date')) {
    return 'datetime';
  }
  if (t.includes('bool')) {
    return 'boolean';
  }
  if (t.includes('json') || t.includes('array')) {
    return 'json';
  }
  return 'other';
}

// Calculate actual visual height of a table card based on its column count
export function calculateTableHeight(table: Table): number {
  const headerHeight = 60;
  const rowHeight = 35;
  const footerHeight = 44;
  const minHeight = 140;
  const contentHeight = headerHeight + table.columns.length * rowHeight + footerHeight;
  return Math.max(minHeight, contentHeight);
}

// Computes non-overlapping positions using hierarchical DAG column packing
export function calculateAutoLayout(
  tables: Table[],
  relationships: Relationship[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (tables.length === 0) return positions;

  const cardWidth = 320;
  const horizontalGap = 90; // Space between columns for relationship wires
  const verticalGap = 50;   // Guaranteed space between stacked tables
  const startX = 60;
  const startY = 60;

  // Determine dependency layers based on FKs
  // Tables without FKs (parent entities) go to earlier columns
  const tableLayer = new Map<string, number>();

  // Pass 1: initialize layers
  tables.forEach((t) => {
    tableLayer.set(t.name.toLowerCase(), 0);
  });

  // Pass 2: topological push
  for (let pass = 0; pass < 4; pass++) {
    relationships.forEach((rel) => {
      const src = rel.sourceTable.toLowerCase(); // table with FK
      const tgt = rel.targetTable.toLowerCase(); // table with PK (parent)

      const tgtLayer = tableLayer.get(tgt) ?? 0;
      const srcLayer = tableLayer.get(src) ?? 0;

      // The referencing table (FK) is placed in a column to the right of parent (PK)
      if (srcLayer <= tgtLayer) {
        tableLayer.set(src, tgtLayer + 1);
      }
    });
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
      positions.set(table.id.toLowerCase(), {
        x: currentX,
        y: currentY,
      });

      const tableHeight = calculateTableHeight(table);
      // Advance Y position with guaranteed margin so tables never overlap
      currentY += tableHeight + verticalGap;
    });

    currentX += cardWidth + horizontalGap;
  });

  return positions;
}

// Fallback position for a single table
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

export function parseSqlLive(
  sql: string,
  existingTablesMap?: Map<string, { x: number; y: number }>
): SchemaParseResult {
  const tables: Table[] = [];
  const relationships: Relationship[] = [];
  const errors: string[] = [];

  if (!sql || !sql.trim()) {
    return { tables, relationships, errors, totalStatements: 0 };
  }

  // Remove block comments and line comments safely
  const cleanedSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  // 1. Extract CREATE TABLE statements with balanced parenthesis tracking
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?([a-zA-Z0-9_]+)[`"']?)/gi;

  let match: RegExpExecArray | null;
  const seenTableNames = new Set<string>();

  while ((match = createTableRegex.exec(cleanedSql)) !== null) {
    const rawTableName = match[2];
    if (!rawTableName) continue;

    const tableName = rawTableName.toLowerCase();
    if (seenTableNames.has(tableName)) continue;
    seenTableNames.add(tableName);

    // Look for opening parenthesis of the table body after CREATE TABLE <name>
    const afterNameIndex = match.index + match[0].length;
    const openParenIndex = cleanedSql.indexOf('(', afterNameIndex);

    let body = '';
    if (openParenIndex !== -1) {
      // Extract balanced content inside ( ... )
      let depth = 1;
      let inQuotes = false;
      let quoteChar = '';
      let endIndex = cleanedSql.length;

      for (let i = openParenIndex + 1; i < cleanedSql.length; i++) {
        const char = cleanedSql[i];

        if (inQuotes) {
          if (char === quoteChar && cleanedSql[i - 1] !== '\\') {
            inQuotes = false;
          }
          continue;
        }

        if (char === "'" || char === '"' || char === '`') {
          inQuotes = true;
          quoteChar = char;
          continue;
        }

        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }

      body = cleanedSql.substring(openParenIndex + 1, endIndex);
      // Advance regex search position past the table if closed
      createTableRegex.lastIndex = endIndex + 1;
    }
    const columns: Column[] = [];

    // Parse body lines
    // Split by commas, but ignore commas inside parentheses like DECIMAL(10, 2) or VARCHAR(255)
    const rawLines = splitByTopLevelCommas(body);

    for (const line of rawLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check for table-level foreign key
      // e.g. FOREIGN KEY (user_id) REFERENCES users(id)
      const tableFkMatch = trimmedLine.match(
        /(?:CONSTRAINT\s+[`"']?[a-zA-Z0-9_]+[`"']?\s+)?FOREIGN\s+KEY\s*\(([`"']?[a-zA-Z0-9_]+[`"']?)\)\s*REFERENCES\s+([`"']?[a-zA-Z0-9_]+[`"']?)(?:\s*\(([`"']?[a-zA-Z0-9_]+[`"']?)\))?/i
      );

      if (tableFkMatch) {
        const sourceColName = cleanIdentifier(tableFkMatch[1]);
        const targetTableName = cleanIdentifier(tableFkMatch[2]);
        const targetColName = tableFkMatch[3] ? cleanIdentifier(tableFkMatch[3]) : sourceColName;

        // Find existing column and augment with FK
        const targetCol = columns.find(c => c.name === sourceColName);
        if (targetCol) {
          targetCol.isForeignKey = true;
          targetCol.category = 'key';
          targetCol.fkTarget = { table: targetTableName, column: targetColName };
        }

        relationships.push({
          id: `${tableName}.${sourceColName}->${targetTableName}.${targetColName}`,
          sourceTable: tableName,
          sourceColumn: sourceColName,
          targetTable: targetTableName,
          targetColumn: targetColName,
          cardinality: '1:N',
        });
        continue;
      }

      // Check for table-level primary key
      // e.g. PRIMARY KEY (id, tenant_id)
      const tablePkMatch = trimmedLine.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (tablePkMatch) {
        const pkCols = tablePkMatch[1].split(',').map(s => cleanIdentifier(s.trim()));
        for (const pkCol of pkCols) {
          const col = columns.find(c => c.name === pkCol);
          if (col) {
            col.isPrimaryKey = true;
            col.category = 'key';
          }
        }
        continue;
      }

      // Parse column definition
      // Format: <col_name> <type> [modifiers...]
      const colParts = trimmedLine.split(/\s+/);
      if (colParts.length === 0) continue;

      const rawColName = colParts[0];
      const colName = cleanIdentifier(rawColName);
      if (!colName || isReservedKeyword(colName)) continue;

      const rawType = colParts[1] || 'VARCHAR';
      const modifiers = colParts.slice(2).join(' ').toUpperCase();

      const isPk = modifiers.includes('PRIMARY KEY') || 
                   modifiers.includes('PK') || 
                   modifiers.includes('AUTO_INCREMENT') || 
                   rawType.toUpperCase().includes('SERIAL') ||
                   rawType.toUpperCase().includes('AUTO_INCREMENT');
      const isUnique = modifiers.includes('UNIQUE');
      const isNotNull = modifiers.includes('NOT NULL');

      // Check inline references
      // e.g. user_id INT REFERENCES users(id)
      let isFk = false;
      let fkTarget: { table: string; column: string } | undefined;

      const inlineFkMatch = trimmedLine.match(/REFERENCES\s+([`"']?[a-zA-Z0-9_]+[`"']?)(?:\s*\(([`"']?[a-zA-Z0-9_]+[`"']?)\))?/i);
      if (inlineFkMatch) {
        isFk = true;
        const targetTable = cleanIdentifier(inlineFkMatch[1]);
        const targetCol = inlineFkMatch[2] ? cleanIdentifier(inlineFkMatch[2]) : 'id';
        fkTarget = { table: targetTable, column: targetCol };

        relationships.push({
          id: `${tableName}.${colName}->${targetTable}.${targetCol}`,
          sourceTable: tableName,
          sourceColumn: colName,
          targetTable: targetTable,
          targetColumn: targetCol,
          cardinality: '1:N',
        });
      }

      const category = categorizeType(rawType, isPk, isFk);

      columns.push({
        id: `${tableName}_${colName}`,
        name: colName,
        rawType: rawType.toUpperCase(),
        category,
        isPrimaryKey: isPk,
        isForeignKey: isFk,
        fkTarget,
        isNullable: !isNotNull && !isPk,
        isUnique,
        sampleValues: [],
      });
    }

    const tableIndex = tables.length;
    // Maintain existing position if table was already moved by user
    const savedPos = existingTablesMap?.get(tableName);
    const position = savedPos || calculateDefaultPosition(tableIndex, 8);

    tables.push({
      id: tableName,
      name: tableName,
      columns,
      rows: [],
      position,
    });
  }

  // 2. Extract INSERT statements and inject live rows into matching tables
  // Uses balanced-paren extractor to correctly handle function calls like
  // CONCAT('A', i), LPAD(i, 8, '0'), NOW(), etc. inside VALUES
  const insertRegex = /INSERT\s+INTO\s+[`"']?([a-zA-Z0-9_]+)[`"']?\s*\(([^)]+)\)\s*VALUES\s*/gi;
  let insertMatch: RegExpExecArray | null;

  while ((insertMatch = insertRegex.exec(cleanedSql)) !== null) {
    const rawTargetTable = insertMatch[1];
    if (!rawTargetTable) continue;
    const targetTable = cleanIdentifier(rawTargetTable).toLowerCase();
    const table = tables.find(t => t.name === targetTable);
    if (!table) continue;

    const colsRaw = insertMatch[2];
    const targetColNames = colsRaw
      ? colsRaw.split(',').map(c => cleanIdentifier(c.trim()))
      : table.columns.map(c => c.name);

    // Extract all value tuples with balanced-paren scanning
    const startPos = insertMatch.index + insertMatch[0].length;
    const tuples = extractValueTuples(cleanedSql, startPos);

    for (const tuple of tuples) {
      const rawValues = splitByTopLevelCommas(tuple);
      const rowData: Record<string, any> = {};

      targetColNames.forEach((colName, idx) => {
        const rawVal = rawValues[idx]?.trim() ?? 'null';
        const parsedVal = cleanLiteralValue(rawVal);
        rowData[colName] = parsedVal;

        // Append to sample values list of the column for preview badges
        const colDef = table.columns.find(c => c.name === colName);
        if (colDef) {
          if (!colDef.sampleValues) colDef.sampleValues = [];
          if (
            colDef.sampleValues.length < 5 &&
            parsedVal !== null &&
            !colDef.sampleValues.includes(parsedVal)
          ) {
            colDef.sampleValues.push(parsedVal);
          }
        }
      });

      table.rows.push(rowData);
    }
  }

  return {
    tables,
    relationships,
    errors,
    totalStatements: tables.length,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract all balanced (…) tuples from a VALUES list.
 * Correctly handles nested function calls: CONCAT('A ', i), LPAD(i, 8, '0').
 */
function extractValueTuples(sql: string, startIndex: number): string[] {
  const tuples: string[] = [];
  let i = startIndex;

  // Skip leading whitespace
  while (i < sql.length && /\s/.test(sql[i])) i++;

  while (i < sql.length) {
    if (sql[i] !== '(') break; // no more tuples

    let depth = 1;
    let inQuotes = false;
    let quoteChar = '';
    let j = i + 1;

    while (j < sql.length && depth > 0) {
      const ch = sql[j];
      if (inQuotes) {
        if (ch === quoteChar && sql[j - 1] !== '\\') inQuotes = false;
      } else if (ch === "'" || ch === '"' || ch === '`') {
        inQuotes = true;
        quoteChar = ch;
      } else if (ch === '(') {
        depth++;
      } else if (ch === ')') {
        depth--;
      }
      j++;
    }

    // j is now 1 past the closing ')'
    tuples.push(sql.substring(i + 1, j - 1));
    i = j;

    // Skip whitespace + commas between tuples
    while (i < sql.length && /[\s,]/.test(sql[i])) i++;

    // Stop at statement terminator or next SQL keyword
    if (i >= sql.length || sql[i] === ';') break;
    if (/^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|SELECT)\b/i.test(sql.slice(i))) break;
  }

  return tuples;
}

/** Split a comma-separated string but ignore commas inside () or quotes */
function splitByTopLevelCommas(str: string): string[] {
  const results: string[] = [];
  let current = '';
  let parenDepth = 0;
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (inQuotes) {
      current += char;
      if (char === quoteChar && str[i - 1] !== '\\') {
        inQuotes = false;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      inQuotes = true;
      quoteChar = char;
      current += char;
      continue;
    }

    if (char === '(') {
      parenDepth++;
      current += char;
      continue;
    }

    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += char;
      continue;
    }

    if (char === ',' && parenDepth === 0) {
      results.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    results.push(current);
  }

  return results;
}

function cleanIdentifier(name: string): string {
  return name.replace(/[`"']/g, '').trim();
}

/**
 * Parse a raw SQL value token into a JS value.
 * SQL expressions (functions, keywords) are converted to readable placeholders.
 */
function cleanLiteralValue(val: string): any {
  const trimmed = val.trim();

  // Bare SQL keywords
  const upper = trimmed.toUpperCase();
  if (upper === 'NULL') return null;
  if (upper === 'TRUE') return true;
  if (upper === 'FALSE') return false;
  if (/^(CURRENT_TIMESTAMP|NOW\(\)|SYSDATE\(\))$/.test(upper)) return '(agora)';
  if (/^(CURRENT_DATE|CURDATE\(\))$/.test(upper)) return '(hoje)';
  if (/^(CURRENT_TIME|CURTIME\(\))$/.test(upper)) return '(hora)';
  if (upper === 'DEFAULT') return '(padrão)';

  // Any SQL function call: CONCAT(...), LPAD(...), UUID(), MD5(...), etc.
  if (/^[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(trimmed)) {
    const funcName = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)/)?.[1] ?? 'expr';
    return `\u27e8${funcName}(\u2026)\u27e9`; // ⟨FuncName(…)⟩
  }

  // Strip surrounding string quotes (single, double, backtick)
  const unquoted = trimmed.replace(/^(['"`])(.*)\1$/, '$2').trim();
  if (unquoted.toLowerCase() === 'null') return null;
  const num = Number(unquoted);
  if (!isNaN(num) && unquoted !== '') return num;
  return unquoted;
}

function isReservedKeyword(word: string): boolean {
  const reserved = ['primary', 'foreign', 'key', 'constraint', 'check', 'unique', 'index'];
  return reserved.includes(word.toLowerCase());
}
