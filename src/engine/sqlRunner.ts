// Runs the workspace SQL in an in-browser SQLite (sql.js / WebAssembly). Students write MySQL,
// so the common MySQL-only syntax is translated first; what can't be translated is reported.
import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import type { SqlTab } from '../types/schema';

export type RunItem =
  | { kind: 'rows'; tab: string; line: number; sql: string; columns: string[]; rows: SqlValue[][] }
  /** changes is -1 for statements that don't modify rows (CREATE, DROP…) */
  | { kind: 'ok'; tab: string; line: number; sql: string; changes: number }
  | { kind: 'error'; tab: string; line: number; sql: string; message: string }
  | { kind: 'skipped'; tab: string; line: number; sql: string; message: string };

export interface RunResult {
  items: RunItem[];
  ms: number;
}

let sqlJs: Promise<SqlJsStatic> | null = null;

/** Run every tab, in order, on a fresh database */
export async function runWorkspace(tabs: SqlTab[]): Promise<RunResult> {
  sqlJs ??= initSqlJs({ locateFile: () => wasmUrl });
  const SQL = await sqlJs;
  const started = performance.now();
  const db = new SQL.Database();
  const items: RunItem[] = [];

  try {
    registerMySqlFunctions(db);
    db.run('PRAGMA foreign_keys = ON');
    db.run(`CREATE TABLE ${GUARD} (x)`);

    for (const tab of tabs) {
      for (const stmt of splitStatements(tab.content)) {
        const base = { tab: tab.title, line: stmt.line, sql: stmt.sql };
        const translated = translate(stmt.sql);
        if ('skip' in translated) {
          items.push({ kind: 'skipped', ...base, message: translated.skip });
          continue;
        }
        try {
          const results = db.exec(translated.sql);
          if (results.length > 0) {
            const last = results[results.length - 1];
            items.push({ kind: 'rows', ...base, columns: last.columns, rows: last.values });
          } else {
            // getRowsModified() keeps the last DML count, so only report it for DML
            const isDml = /^\s*(INSERT|UPDATE|DELETE|REPLACE|TRUNCATE)\b/i.test(stmt.sql);
            items.push({ kind: 'ok', ...base, changes: isDml ? db.getRowsModified() : -1 });
          }
        } catch (err) {
          items.push({ kind: 'error', ...base, message: friendlyError(String((err as Error).message ?? err)) });
        }
      }
    }
  } finally {
    db.close();
  }

  return { items, ms: Math.round(performance.now() - started) };
}

// ---------------------------------------------------------------------------
// Statement splitting (comments removed, DELIMITER honoured, BEGIN…END kept together)
// ---------------------------------------------------------------------------
export function splitStatements(script: string): { sql: string; line: number }[] {
  const out: { sql: string; line: number }[] = [];
  let delimiter = ';';
  let buf = '';
  let bufLine = 1;
  let line = 1;
  let depth = 0; // BEGIN…END nesting, only counted inside routines

  const flush = () => {
    const sql = buf.trim();
    if (sql) out.push({ sql, line: bufLine });
    buf = '';
    depth = 0;
  };

  for (let i = 0; i < script.length; i++) {
    const ch = script[i];
    if (!buf.trim()) bufLine = line;

    // DELIMITER $$ (only between statements, at the start of a line)
    if (!buf.trim() && (i === 0 || script[i - 1] === '\n')) {
      const m = script.slice(i).match(/^[ \t]*DELIMITER[ \t]+(\S+)[ \t]*(?:\r?\n|$)/i);
      if (m) {
        delimiter = m[1];
        i += m[0].length - 1;
        if (m[0].endsWith('\n')) line++;
        continue;
      }
    }

    if (ch === '\n') line++;

    // Comments become spaces (newlines kept so line numbers stay right)
    if ((ch === '-' && script[i + 1] === '-') || ch === '#') {
      while (i < script.length && script[i] !== '\n') i++;
      i--;
      continue;
    }
    if (ch === '/' && script[i + 1] === '*') {
      const end = script.indexOf('*/', i + 2);
      const stop = end === -1 ? script.length : end + 2;
      const skipped = script.slice(i, stop);
      line += (skipped.match(/\n/g) ?? []).length;
      buf += skipped.replace(/[^\n]/g, ' ');
      i = stop - 1;
      continue;
    }

    // String literals are copied as-is
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < script.length) {
        if (script[j] === '\\') { j += 2; continue; }
        if (script[j] === ch) { if (script[j + 1] === ch) { j += 2; continue; } break; }
        j++;
      }
      const literal = script.slice(i, j + 1);
      line += (literal.match(/\n/g) ?? []).length;
      buf += literal;
      i = j;
      continue;
    }

    // Words: track BEGIN/END inside CREATE TRIGGER/PROCEDURE/FUNCTION without DELIMITER
    if (/[A-Za-z_]/.test(ch) && !/\w/.test(script[i - 1] ?? '')) {
      const word = script.slice(i).match(/^\w+/)![0];
      const upper = word.toUpperCase();
      if (delimiter === ';' && /^\s*CREATE\b[\s\S]*\b(TRIGGER|PROCEDURE|FUNCTION|EVENT)\b/i.test(buf + word)) {
        if (upper === 'BEGIN' || (upper === 'CASE' && depth > 0)) depth++;
        else if (upper === 'END' && depth > 0) {
          const next = script.slice(i + 3).match(/^\s+(\w+)/)?.[1]?.toUpperCase();
          if (!next || !['IF', 'LOOP', 'WHILE', 'REPEAT'].includes(next)) depth--;
        }
      }
      buf += word;
      i += word.length - 1;
      continue;
    }

    if (depth === 0 && script.startsWith(delimiter, i)) {
      flush();
      i += delimiter.length - 1;
      continue;
    }

    buf += ch;
  }
  flush();
  return out;
}

// ---------------------------------------------------------------------------
// MySQL → SQLite
// ---------------------------------------------------------------------------
// Set while an emulated "SET NEW.col" trigger rewrites a row, so that UPDATE doesn't fire the
// user's UPDATE triggers (in MySQL the change happens inside the original statement)
const GUARD = '_liveschema_trigger_guard';
const NOT_GUARDED = `NOT EXISTS (SELECT 1 FROM ${GUARD})`;

const INT_TYPES = String.raw`(?:TINYINT|SMALLINT|MEDIUMINT|INTEGER|INT|BIGINT)(?:\s*\(\s*\d+\s*\))?(?:\s+UNSIGNED)?`;

export function translate(sql: string): { sql: string } | { skip: string } {
  const head = sql.replace(/\s+/g, ' ').toUpperCase();

  if (/^(CREATE|DROP) (DATABASE|SCHEMA)\b/.test(head) || /^USE /.test(head)) {
    return { skip: 'Ignorado: aqui existe um único banco, recriado a cada execução.' };
  }
  if (/^SET /.test(head)) return { skip: 'Ignorado: variáveis e configurações do MySQL (SET) não se aplicam.' };
  if (/^(SHOW|DESCRIBE|DESC) /.test(head)) return { skip: 'Não suportado: SHOW/DESCRIBE são comandos do MySQL. Use SELECT.' };
  if (/^(CREATE (DEFINER=\S+ )?(PROCEDURE|FUNCTION|EVENT)|CALL |DROP (PROCEDURE|FUNCTION|EVENT))/.test(head)) {
    return { skip: 'Não suportado: procedures, functions e events do MySQL não rodam no SQLite.' };
  }

  if (/^CREATE (DEFINER=\S+ )?TRIGGER /.test(head)) return translateTrigger(sql);

  let out = sql;
  if (/^CREATE (TEMPORARY )?TABLE /.test(head)) out = translateCreateTable(out);
  out = out
    .replace(/^INSERT\s+IGNORE\s+INTO/i, 'INSERT OR IGNORE INTO')
    .replace(/^TRUNCATE\s+(?:TABLE\s+)?/i, 'DELETE FROM ')
    .replace(/\bIF\s*\(/gi, 'iif(');
  return { sql: out };
}

function translateCreateTable(sql: string): string {
  let out = sql
    // id INT AUTO_INCREMENT → id INTEGER (INTEGER PRIMARY KEY is SQLite's auto-increment column)
    .replace(new RegExp(String.raw`(\s)${INT_TYPES}((?:(?!,)[^,])*?)\s+AUTO_INCREMENT\b`, 'gi'), '$1INTEGER$2')
    .replace(/\s+AUTO_INCREMENT\b/gi, '')
    .replace(/\s+(UNSIGNED|ZEROFILL)\b/gi, '')
    .replace(/\b(ENUM|SET)\s*\([^)]*\)/gi, 'TEXT')
    .replace(/\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP(\(\))?/gi, '')
    .replace(/\s+COMMENT\s+'(?:[^'\\]|\\.|'')*'/gi, '')
    // MySQL-only index lines inside the table
    .replace(/,\s*(?:FULLTEXT\s+|SPATIAL\s+)?(?:KEY|INDEX)\s+[`"\w]*\s*\([^)]*\)/gi, '')
    .replace(/\bUNIQUE\s+(?:KEY|INDEX)\s+[`"\w]*\s*\(/gi, 'UNIQUE (');
  // Table options after the closing parenthesis: ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 …
  const close = out.lastIndexOf(')');
  if (close !== -1 && /^\s*(ENGINE|DEFAULT|CHARSET|CHARACTER|COLLATE|AUTO_INCREMENT|COMMENT|ROW_FORMAT)\b/i.test(out.slice(close + 1))) {
    out = out.slice(0, close + 1);
  }
  return out;
}

function translateTrigger(sql: string): { sql: string } | { skip: string } {
  const m = sql.match(/^CREATE\s+(?:DEFINER\s*=\s*\S+\s+)?TRIGGER\s+([\s\S]+?\bFOR\s+EACH\s+ROW)\s+([\s\S]*)$/i);
  if (!m) return { sql };
  const [, header, rawBody] = m;
  let body = rawBody.trim();
  let when = '';

  const block = body.match(/^BEGIN\s+([\s\S]*?)\s*END$/i);
  if (block) {
    body = block[1].trim().replace(/;\s*$/, '');
    // A body that is only IF cond THEN … END IF becomes SQLite's WHEN cond
    const onlyIf = body.match(/^IF\s+([\s\S]+?)\s+THEN\s+([\s\S]*?);?\s*END\s+IF$/i);
    if (onlyIf && !/\b(ELSE|ELSEIF)\b/i.test(onlyIf[2])) {
      when = ` WHEN ${onlyIf[1]}`;
      body = onlyIf[2].trim().replace(/;\s*$/, '');
    }
  }

  if (/\bSET\s+NEW\./i.test(body)) return translateSetNewTrigger(header, when, body);
  if (/\b(IF|ELSEIF|WHILE|LOOP|REPEAT|DECLARE|SIGNAL)\b/i.test(body)) {
    return { skip: 'Não suportado no SQLite: IF, laços, DECLARE ou SIGNAL dentro do trigger (só um IF envolvendo todo o corpo é convertido).' };
  }
  return { sql: `CREATE TRIGGER ${header}${guardUpdate(header, when)} BEGIN ${body}; END` };
}

/** WHEN clause for a trigger, adding the guard to UPDATE triggers */
function guardUpdate(header: string, when: string): string {
  if (!/\bUPDATE\b[\s\S]*\bON\b/i.test(header)) return when;
  return when ? `${when} AND ${NOT_GUARDED}` : ` WHEN ${NOT_GUARDED}`;
}

/**
 * SQLite triggers can't assign NEW.col. A BEFORE INSERT/UPDATE trigger made only of
 * SET NEW.col = expr becomes an AFTER trigger that updates the row it just wrote
 * (SQLite doesn't fire triggers recursively by default, so this doesn't loop).
 */
function translateSetNewTrigger(header: string, when: string, body: string): { sql: string } | { skip: string } {
  const unsupported = { skip: 'Não suportado no SQLite: trigger que altera NEW junto com outros comandos (só SET NEW.coluna = … em BEFORE INSERT/UPDATE é convertido).' };
  const h = header.match(/^(\S+)\s+BEFORE\s+(INSERT|UPDATE(?:\s+OF\s+[\w\s,`"]+?)?)\s+ON\s+(\S+)\s+FOR\s+EACH\s+ROW$/i);
  if (!h) return unsupported;
  const [, name, event, table] = h;

  const assignments: string[] = [];
  for (const statement of splitTopLevel(body, ';')) {
    const set = statement.match(/^SET\s+([\s\S]+)$/i);
    if (!set) return unsupported;
    for (const assignment of splitTopLevel(set[1], ',')) {
      const a = assignment.match(/^NEW\.(\w+)\s*=\s*([\s\S]+)$/i);
      if (!a) return unsupported;
      assignments.push(`${a[1]} = (${a[2]})`);
    }
  }
  return {
    sql:
      `CREATE TRIGGER ${name} AFTER ${event} ON ${table} FOR EACH ROW${guardUpdate(header, when)} BEGIN ` +
      `INSERT INTO ${GUARD} VALUES (1); ` +
      `UPDATE ${table} SET ${assignments.join(', ')} WHERE rowid = NEW.rowid; ` +
      `DELETE FROM ${GUARD}; END`,
  };
}

/** Split on `sep` outside quotes and parentheses; empty parts dropped */
function splitTopLevel(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) { if (ch === quote) quote = ''; continue; }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === sep && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

// MySQL functions students use that SQLite doesn't have
function registerMySqlFunctions(db: Database) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  db.create_function('NOW', () => { const d = new Date(); return `${date(d)} ${time(d)}`; });
  db.create_function('CURDATE', () => date(new Date()));
  db.create_function('CURTIME', () => time(new Date()));
  db.create_function('CONCAT', (...parts: SqlValue[]) => (parts.some((p) => p === null) ? null : parts.join('')));
}

const ERROR_HINTS: [RegExp, string][] = [
  [/no such table: (\S+)/, 'A tabela "$1" não existe (ela foi criada antes deste comando?).'],
  [/no such column: (\S+)/, 'A coluna "$1" não existe.'],
  [/UNIQUE constraint failed: (\S+)/, 'Valor repetido em "$1", que é UNIQUE ou PRIMARY KEY.'],
  [/NOT NULL constraint failed: (\S+)/, '"$1" é NOT NULL e ficou sem valor.'],
  [/FOREIGN KEY constraint failed/, 'Chave estrangeira inválida: o valor não existe na tabela referenciada.'],
  [/table (\S+) already exists/, 'A tabela "$1" já foi criada.'],
  [/table (\S+) has (\d+) columns but (\d+) values were supplied/, 'A tabela "$1" tem $2 colunas, mas foram passados $3 valores.'],
  [/near "([^"]*)": syntax error/, 'Erro de sintaxe perto de "$1".'],
];

function friendlyError(message: string): string {
  for (const [re, text] of ERROR_HINTS) {
    const m = message.match(re);
    if (m) return `${m[0].replace(re, text)} (${message})`;
  }
  return message;
}
