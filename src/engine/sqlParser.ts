import type { Column, ColumnCategory, Relationship, SchemaParseResult, Table } from '../types/schema';
import { calculateDefaultPosition } from './layout';

export function categorizeType(rawType: string, isPk: boolean, isFk: boolean): ColumnCategory {
  if (isPk || isFk) return 'key';
  const t = rawType.toLowerCase();
  if (t.includes('serial') || t.includes('uuid')) return 'key';
  if (t.startsWith('bool') || t === 'tinyint(1)' || t === 'bit' || t === 'bit(1)') return 'boolean';
  if (t.startsWith('interval')) return 'other';
  if (t.includes('int') || t.includes('float') || t.includes('double') || t.includes('decimal') || t.includes('numeric') || t.includes('real') || t.includes('money')) {
    return 'numeric';
  }
  if (t.includes('char') || t.includes('text') || t.includes('string') || t.startsWith('enum') || t.startsWith('set(')) {
    return 'text';
  }
  if (t.includes('time') || t.includes('date') || t === 'year') {
    return 'datetime';
  }
  if (t.includes('json') || t.includes('array') || t.endsWith('[]')) {
    return 'json';
  }
  return 'other';
}

// Identifier: optionally quoted with ` or ", optionally prefixed by a schema (`loja.cliente`)
const IDENT = String.raw`[\`"]?(?:\w+[\`"]?\.[\`"]?)?(\w+)[\`"]?`;

const CREATE_TABLE_RE = new RegExp(
  String.raw`CREATE\s+(?:TEMPORARY\s+|TEMP\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?${IDENT}`,
  'gi'
);
const INSERT_RE = new RegExp(
  String.raw`INSERT\s+(?:IGNORE\s+)?INTO\s+${IDENT}\s*(?:\(([^)]*)\)\s*)?VALUES?\s*`,
  'gi'
);
const TABLE_FK_RE = new RegExp(
  String.raw`^(?:CONSTRAINT\s+[\`"]?\w+[\`"]?\s+)?FOREIGN\s+KEY\s*(?:[\`"]?\w+[\`"]?\s*)?\(([^)]+)\)\s*REFERENCES\s+${IDENT}(?:\s*\(([^)]+)\))?`,
  'i'
);
const INLINE_FK_RE = new RegExp(
  String.raw`\bREFERENCES\s+${IDENT}(?:\s*\(\s*[\`"]?(\w+)[\`"]?\s*\))?`,
  'i'
);
const TABLE_PK_RE = /^(?:CONSTRAINT\s+[`"]?\w+[`"]?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i;
const TABLE_UNIQUE_RE = /^(?:CONSTRAINT\s+[`"]?\w+[`"]?\s+)?UNIQUE(?:\s+(?:KEY|INDEX))?\s*(?:[`"]?\w+[`"]?\s*)?\(([^)]+)\)/i;
// Type name (possibly multi-word, e.g. DOUBLE PRECISION) followed by an optional (size)
const COLUMN_TYPE_RE = /^([A-Za-z_]\w*(?:\s+(?:PRECISION|VARYING|UNSIGNED|SIGNED|ZEROFILL))*)\s*(\([^)]*\))?(\s*\[\])?/i;

/**
 * Parse the SQL into tables (with columns and sample rows) and FK relationships.
 * Positions come from `existingTablesMap` when the user already placed a table,
 * otherwise a grid fallback is used.
 */
export function parseSqlLive(
  sql: string,
  existingTablesMap?: Map<string, { x: number; y: number }>
): SchemaParseResult {
  const tables: Table[] = [];
  const relationships: Relationship[] = [];
  const errors: string[] = [];

  if (!sql || !sql.trim()) {
    return { tables, relationships, errors };
  }

  const cleanedSql = stripComments(sql);

  // 1. Extract CREATE TABLE statements with balanced parenthesis tracking
  const createTableRegex = new RegExp(CREATE_TABLE_RE.source, CREATE_TABLE_RE.flags);
  let match: RegExpExecArray | null;
  const seenTableNames = new Set<string>();

  while ((match = createTableRegex.exec(cleanedSql)) !== null) {
    const rawTableName = match[1];
    if (!rawTableName) continue;

    const tableName = rawTableName.toLowerCase();

    // Look for opening parenthesis of the table body after CREATE TABLE <name>
    const afterNameIndex = match.index + match[0].length;
    const openParenIndex = cleanedSql.indexOf('(', afterNameIndex);
    // Only accept the paren if nothing but whitespace sits between it and the name
    if (openParenIndex === -1 || cleanedSql.slice(afterNameIndex, openParenIndex).trim() !== '') {
      continue;
    }

    let endIndex = findClosingParen(cleanedSql, openParenIndex);
    if (endIndex === -1) {
      errors.push(`Tabela "${rawTableName}": parêntese de fechamento ")" não encontrado.`);
      // Still being typed: stop at the end of the statement so the tables after it keep rendering
      const semi = cleanedSql.indexOf(';', openParenIndex);
      endIndex = semi === -1 ? cleanedSql.length : semi;
    }
    const body = cleanedSql.substring(openParenIndex + 1, endIndex);
    // Advance regex search position past the table body
    createTableRegex.lastIndex = endIndex + 1;

    if (seenTableNames.has(tableName)) {
      errors.push(`Tabela "${rawTableName}" foi criada mais de uma vez; apenas a primeira definição é usada.`);
      continue;
    }
    seenTableNames.add(tableName);

    const columns: Column[] = [];
    const findColumn = (name: string) => columns.find((c) => c.name.toLowerCase() === name.toLowerCase());
    // Table-level constraints may come before the column they refer to, so apply them at the end
    const pendingConstraints: (() => void)[] = [];

    // Split by commas, but ignore commas inside parentheses like DECIMAL(10, 2) or VARCHAR(255)
    for (const line of splitByTopLevelCommas(body)) {
      const trimmedLine = line.trim().replace(/\s+/g, ' ');
      if (!trimmedLine) continue;

      // Table-level foreign key, e.g. FOREIGN KEY (user_id) REFERENCES users(id)
      const tableFkMatch = trimmedLine.match(TABLE_FK_RE);
      if (tableFkMatch) {
        const sourceCols = splitIdentifierList(tableFkMatch[1]);
        const targetTableName = tableFkMatch[2].toLowerCase();
        const targetCols = tableFkMatch[3] ? splitIdentifierList(tableFkMatch[3]) : [];

        sourceCols.forEach((sourceColName, idx) => {
          const targetColName = targetCols[idx] ?? '';
          addRelationship(relationships, tableName, sourceColName, targetTableName, targetColName);
          pendingConstraints.push(() => {
            const col = findColumn(sourceColName);
            if (!col) {
              errors.push(`Tabela "${tableName}": FOREIGN KEY usa a coluna "${sourceColName}", que não existe.`);
              return;
            }
            col.isForeignKey = true;
            col.category = 'key';
            col.fkTarget = { table: targetTableName, column: targetColName };
          });
        });
        continue;
      }

      // Table-level primary key, e.g. PRIMARY KEY (id, tenant_id)
      const tablePkMatch = trimmedLine.match(TABLE_PK_RE);
      if (tablePkMatch) {
        for (const pkCol of splitIdentifierList(tablePkMatch[1])) {
          pendingConstraints.push(() => {
            const col = findColumn(pkCol);
            if (!col) {
              errors.push(`Tabela "${tableName}": PRIMARY KEY usa a coluna "${pkCol}", que não existe.`);
              return;
            }
            col.isPrimaryKey = true;
            col.isNullable = false;
            col.category = 'key';
          });
        }
        continue;
      }

      // Table-level unique, e.g. UNIQUE (email) or CONSTRAINT uq_email UNIQUE KEY (email)
      const tableUniqueMatch = trimmedLine.match(TABLE_UNIQUE_RE);
      if (tableUniqueMatch) {
        const uniqueCols = splitIdentifierList(tableUniqueMatch[1]);
        pendingConstraints.push(() => {
          // A composite UNIQUE doesn't make each column unique on its own
          if (uniqueCols.length !== 1) return;
          const col = findColumn(uniqueCols[0]);
          if (col) col.isUnique = true;
        });
        continue;
      }

      // Parse column definition
      // Format: <col_name> <type> [modifiers...]
      const nameMatch = trimmedLine.match(/^[`"]?(\w+)[`"]?\s*/);
      if (!nameMatch) continue;
      const colName = nameMatch[1];
      if (isReservedKeyword(colName)) continue;

      const rest = trimmedLine.slice(nameMatch[0].length);
      const typeMatch = rest.match(COLUMN_TYPE_RE);
      const rawType = typeMatch
        ? `${typeMatch[1]}${(typeMatch[2] ?? '').replace(/\s+/g, '')}${typeMatch[3]?.trim() ?? ''}`
        : 'VARCHAR';
      const modifiersRaw = typeMatch ? rest.slice(typeMatch[0].length) : rest;
      // Blank out string literals so DEFAULT 'not null' doesn't count as NOT NULL
      const modifiers = modifiersRaw.replace(/'(?:[^'\\]|\\.|'')*'/g, "''").toUpperCase();

      const isPk = /\bPRIMARY\s+KEY\b/.test(modifiers);
      const isUnique = /\bUNIQUE\b/.test(modifiers);
      const isNotNull = /\bNOT\s+NULL\b/.test(modifiers);
      const defaultMatch = modifiersRaw.match(/\bDEFAULT\s+('(?:[^'\\]|\\.|'')*'|\([^)]*\)|[^\s,]+)/i);

      // Inline references, e.g. user_id INT REFERENCES users(id)
      let isFk = false;
      let fkTarget: { table: string; column: string } | undefined;

      const inlineFkMatch = modifiersRaw.match(INLINE_FK_RE);
      if (inlineFkMatch) {
        isFk = true;
        const targetTable = inlineFkMatch[1].toLowerCase();
        const targetCol = inlineFkMatch[2] ?? '';
        fkTarget = { table: targetTable, column: targetCol };
        addRelationship(relationships, tableName, colName, targetTable, targetCol);
      }

      if (findColumn(colName)) {
        errors.push(`Tabela "${tableName}": a coluna "${colName}" foi declarada mais de uma vez.`);
        continue;
      }

      columns.push({
        id: `${tableName}_${colName.toLowerCase()}`,
        name: colName,
        rawType: rawType.toUpperCase(),
        category: categorizeType(rawType, isPk, isFk),
        isPrimaryKey: isPk,
        isForeignKey: isFk,
        fkTarget,
        isNullable: !isNotNull && !isPk,
        isUnique,
        defaultValue: defaultMatch?.[1],
        sampleValues: [],
      });
    }

    pendingConstraints.forEach((apply) => apply());

    // Maintain existing position if table was already moved by user
    const savedPos = existingTablesMap?.get(tableName);
    const position = savedPos || calculateDefaultPosition(tables.length, 8);

    tables.push({
      id: tableName,
      name: tableName,
      columns,
      rows: [],
      position,
    });
  }

  const tableByName = new Map(tables.map((t) => [t.name, t]));

  // 2. Resolve FK targets: a REFERENCES without a column list points at the parent's primary key
  const resolvedRelationships: Relationship[] = [];
  const seenRelIds = new Set<string>();
  for (const rel of relationships) {
    const target = tableByName.get(rel.targetTable);
    if (!target) {
      errors.push(`"${rel.sourceTable}.${rel.sourceColumn}" referencia a tabela "${rel.targetTable}", que não foi criada.`);
    }
    let targetColumn = rel.targetColumn;
    if (!targetColumn) {
      targetColumn = target?.columns.find((c) => c.isPrimaryKey)?.name ?? 'id';
    } else if (target && !target.columns.some((c) => c.name.toLowerCase() === targetColumn.toLowerCase())) {
      errors.push(`"${rel.sourceTable}.${rel.sourceColumn}" referencia "${rel.targetTable}.${targetColumn}", coluna que não existe.`);
    }

    const sourceCol = tableByName.get(rel.sourceTable)?.columns
      .find((c) => c.name.toLowerCase() === rel.sourceColumn.toLowerCase());
    if (sourceCol?.fkTarget && !sourceCol.fkTarget.column) {
      sourceCol.fkTarget = { ...sourceCol.fkTarget, column: targetColumn };
    }

    const id = `${rel.sourceTable}.${rel.sourceColumn.toLowerCase()}->${rel.targetTable}.${targetColumn.toLowerCase()}`;
    // The same FK declared inline and as a table constraint is still one relationship
    if (seenRelIds.has(id)) continue;
    seenRelIds.add(id);
    resolvedRelationships.push({ ...rel, id, targetColumn });
  }

  // 3. Extract INSERT statements and inject live rows into matching tables
  // Uses balanced-paren extractor to correctly handle function calls like
  // CONCAT('A', i), LPAD(i, 8, '0'), NOW(), etc. inside VALUES
  const insertRegex = new RegExp(INSERT_RE.source, INSERT_RE.flags);
  let insertMatch: RegExpExecArray | null;
  const reportedUnknownTables = new Set<string>();

  while ((insertMatch = insertRegex.exec(cleanedSql)) !== null) {
    const targetTable = insertMatch[1].toLowerCase();
    const table = tableByName.get(targetTable);
    if (!table) {
      if (!reportedUnknownTables.has(targetTable)) {
        reportedUnknownTables.add(targetTable);
        errors.push(`INSERT INTO "${insertMatch[1]}": essa tabela não foi criada.`);
      }
      continue;
    }

    // Without a column list, values follow the table's column order
    const targetColumns = insertMatch[2] !== undefined
      ? splitIdentifierList(insertMatch[2]).map((name) => {
          const col = table.columns.find((c) => c.name.toLowerCase() === name.toLowerCase());
          if (!col) errors.push(`INSERT INTO "${table.name}": a coluna "${name}" não existe.`);
          return { key: col?.name ?? name, col };
        })
      : table.columns.map((col) => ({ key: col.name, col }));

    // Extract all value tuples with balanced-paren scanning
    const startPos = insertMatch.index + insertMatch[0].length;
    const tuples = extractValueTuples(cleanedSql, startPos);

    tuples.forEach((tuple, tupleIdx) => {
      const rawValues = splitByTopLevelCommas(tuple);
      if (rawValues.length !== targetColumns.length) {
        errors.push(
          `INSERT INTO "${table.name}" (linha ${tupleIdx + 1}): ${rawValues.length} valor(es) para ${targetColumns.length} coluna(s).`
        );
      }

      const rowData: Record<string, unknown> = {};
      targetColumns.forEach(({ key, col }, idx) => {
        const parsedVal = cleanLiteralValue(rawValues[idx]?.trim() ?? 'null');
        rowData[key] = parsedVal;

        // Append to sample values list of the column for preview badges
        if (col) {
          if (!col.sampleValues) col.sampleValues = [];
          if (
            col.sampleValues.length < 5 &&
            parsedVal !== null &&
            !col.sampleValues.includes(parsedVal)
          ) {
            col.sampleValues.push(parsedVal);
          }
        }
      });

      table.rows.push(rowData);
    });
  }

  return {
    tables,
    relationships: resolvedRelationships,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addRelationship(
  relationships: Relationship[],
  sourceTable: string,
  sourceColumn: string,
  targetTable: string,
  targetColumn: string
) {
  relationships.push({
    id: '', // assigned once the target column is resolved
    sourceTable,
    sourceColumn,
    targetTable,
    targetColumn,
    cardinality: '1:N',
  });
}

/** Remove -- and /* *\/ comments, leaving string literals untouched */
export function stripComments(sql: string): string {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];

    if (ch === "'" || ch === '"' || ch === '`') {
      const end = findQuoteEnd(sql, i);
      out += sql.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    if (ch === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i);
      i = nl === -1 ? sql.length : nl;
      continue;
    }

    if (ch === '#' ) {
      // MySQL-style line comment
      const nl = sql.indexOf('\n', i);
      i = nl === -1 ? sql.length : nl;
      continue;
    }

    if (ch === '/' && sql[i + 1] === '*') {
      const close = sql.indexOf('*/', i + 2);
      out += ' ';
      i = close === -1 ? sql.length : close + 2;
      continue;
    }

    out += ch;
    i++;
  }
  return out;
}

/** Index of the quote closing the literal that opens at `start` (or the last index if unterminated) */
function findQuoteEnd(sql: string, start: number): number {
  const quote = sql[start];
  for (let i = start + 1; i < sql.length; i++) {
    if (sql[i] === '\\') { i++; continue; }
    if (sql[i] === quote) {
      // Doubled quote ('') is an escaped quote inside the literal
      if (sql[i + 1] === quote) { i++; continue; }
      return i;
    }
  }
  return sql.length - 1;
}

/** Index of the ")" matching the "(" at `openIndex`, or -1 */
function findClosingParen(sql: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      i = findQuoteEnd(sql, i);
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Extract all balanced (…) tuples from a VALUES list.
 * Correctly handles nested function calls: CONCAT('A ', i), LPAD(i, 8, '0').
 */
function extractValueTuples(sql: string, startIndex: number): string[] {
  const tuples: string[] = [];
  let i = startIndex;

  // Skip leading whitespace
  while (i < sql.length && /\s/.test(sql[i])) i++;

  while (i < sql.length && sql[i] === '(') {
    const close = findClosingParen(sql, i);
    const end = close === -1 ? sql.length : close;
    tuples.push(sql.substring(i + 1, end));
    i = end + 1;

    // Skip whitespace + commas between tuples
    while (i < sql.length && /[\s,]/.test(sql[i])) i++;
  }

  return tuples;
}

/** Split a comma-separated string but ignore commas inside () or quotes */
function splitByTopLevelCommas(str: string): string[] {
  const results: string[] = [];
  let start = 0;
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === "'" || char === '"' || char === '`') {
      i = findQuoteEnd(str, i);
      continue;
    }
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === ',' && parenDepth === 0) {
      results.push(str.slice(start, i));
      start = i + 1;
    }
  }

  const last = str.slice(start);
  if (last.trim()) results.push(last);

  return results;
}

function cleanIdentifier(name: string): string {
  return name.replace(/[`"']/g, '').trim();
}

/** "a, `b`, c(10)" → ["a", "b", "c"] — index prefix lengths like c(10) are dropped */
function splitIdentifierList(list: string): string[] {
  return list
    .split(',')
    .map((s) => cleanIdentifier(s.replace(/\(.*\)/, '').replace(/\s+(ASC|DESC)$/i, '')))
    .filter(Boolean);
}

/**
 * Parse a raw SQL value token into a JS value.
 * SQL expressions (functions, keywords) are converted to readable placeholders.
 */
function cleanLiteralValue(val: string): string | number | boolean | null {
  const trimmed = val.trim();

  // Bare SQL keywords
  const upper = trimmed.toUpperCase();
  if (upper === 'NULL' || upper === '') return null;
  if (upper === 'TRUE') return true;
  if (upper === 'FALSE') return false;
  if (/^(CURRENT_TIMESTAMP|NOW\(\)|SYSDATE\(\))$/.test(upper)) return '(agora)';
  if (/^(CURRENT_DATE|CURDATE\(\))$/.test(upper)) return '(hoje)';
  if (/^(CURRENT_TIME|CURTIME\(\))$/.test(upper)) return '(hora)';
  if (upper === 'DEFAULT') return '(padrão)';

  // Any SQL function call: CONCAT(...), LPAD(...), UUID(), MD5(...), etc.
  if (/^[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(trimmed)) {
    const funcName = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)/)?.[1] ?? 'expr';
    return `⟨${funcName}(…)⟩`; // ⟨FuncName(…)⟩
  }

  // String literal: strip the quotes and unescape '' and \'
  const quoted = trimmed.match(/^(['"`])([\s\S]*)\1$/);
  if (quoted) {
    const q = quoted[1];
    return quoted[2].split(q + q).join(q).replace(/\\(.)/g, '$1');
  }

  const num = Number(trimmed);
  if (!isNaN(num)) return num;
  return trimmed;
}

function isReservedKeyword(word: string): boolean {
  const reserved = ['primary', 'foreign', 'key', 'constraint', 'check', 'unique', 'index', 'fulltext', 'spatial', 'exclude', 'period', 'like'];
  return reserved.includes(word.toLowerCase());
}
