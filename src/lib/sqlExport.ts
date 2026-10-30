import { stripComments } from '../engine/sqlParser';
import type { SqlTab } from '../types/schema';

export interface SqlExportOptions {
  /** Tabs to export, already in the order they should appear in the file */
  tabs: SqlTab[];
  /** "-- Gerado pelo LiveSchema Studio em …" at the top */
  includeHeader: boolean;
  /** "-- ===== Aba: nome =====" before each tab */
  includeTabTitles: boolean;
  /** CREATE DATABASE + USE at the top (MySQL syntax); empty or invalid name = off */
  databaseName: string;
}

export interface SqlExportResult {
  sql: string;
  warnings: string[];
}

const DELIMITER_RE = /^\s*DELIMITER\s+(\S+)\s*$/gim;

/** Database names we can write without quoting */
export function isValidDatabaseName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/**
 * Join the chosen tabs into one runnable script. A tab whose last statement has no ";" would
 * glue itself to the first statement of the next tab, so the missing terminator is added.
 */
export function buildSqlExport(options: SqlExportOptions): SqlExportResult {
  const warnings: string[] = [];
  const parts: string[] = [];

  if (options.includeHeader) {
    const when = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    parts.push(`-- Gerado pelo LiveSchema Studio em ${when}\n-- Abas: ${options.tabs.map((t) => t.title).join(', ')}`);
  }

  const db = options.databaseName.trim();
  if (db) {
    if (isValidDatabaseName(db)) {
      parts.push(`CREATE DATABASE IF NOT EXISTS ${db};\nUSE ${db};`);
    } else {
      warnings.push(`Nome de banco "${db}" inválido (use letras, números e _); CREATE DATABASE não foi incluído.`);
    }
  }

  for (const tab of options.tabs) {
    let body = tab.content.replace(/\s+$/, '');
    const code = stripComments(body).trim();

    if (!code) {
      warnings.push(`A aba "${tab.title}" está vazia ou só tem comentários.`);
    } else {
      // Scripts with triggers/procedures switch the delimiter; it must be back to ";" at the end
      const delimiters = Array.from(body.matchAll(DELIMITER_RE), (m) => m[1]);
      const finalDelimiter = delimiters.length > 0 ? delimiters[delimiters.length - 1] : ';';
      if (finalDelimiter !== ';') {
        warnings.push(
          `A aba "${tab.title}" termina com DELIMITER ${finalDelimiter}; as abas seguintes podem falhar. Adicione "DELIMITER ;" no fim dela.`
        );
      } else if (delimiters.length === 0 && !code.endsWith(';')) {
        // After a trailing comment the ";" would be commented out, so it goes on its own line
        const lastLine = body.slice(body.lastIndexOf('\n') + 1);
        body += /^\s*(--|#)/.test(lastLine) || body.endsWith('*/') ? '\n;' : ';';
        warnings.push(`A aba "${tab.title}" não terminava com ";" — adicionado na exportação.`);
      }
    }

    parts.push(options.includeTabTitles ? `-- ===== Aba: ${tab.title} =====\n${body}` : body);
  }

  return { sql: parts.filter(Boolean).join('\n\n') + '\n', warnings };
}

/** "Meu Schema" → "Meu Schema.sql"; strips characters Windows doesn't allow in file names */
export function toSqlFileName(name: string): string {
  const base = name.trim().replace(/\.sql$/i, '').replace(/[\\/:*?"<>|]+/g, '_') || 'liveschema';
  return `${base}.sql`;
}

/** Save `text` as a file through the browser's download flow */
export function downloadTextFile(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/sql;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the download a moment to start before releasing the blob
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
