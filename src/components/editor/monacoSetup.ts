// Bundles Monaco with the app instead of letting @monaco-editor/react pull it from a CDN:
// the version always matches package.json, the editor works offline/behind strict CSPs,
// and only the editor core + SQL language ship (no TypeScript/CSS/HTML/JSON workers).
// `editor` is only the API; `features/register.all` adds the editor contributions
// (autocomplete, find, bracket matching, comment toggling, context menu…)
import * as monaco from 'monaco-editor/editor';
import 'monaco-editor/features/register.all';
import 'monaco-editor/languages/definitions/sql/register';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import { loader } from '@monaco-editor/react';
import type { languages } from 'monaco-editor';

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

loader.config({ monaco: monaco as unknown as typeof import('monaco-editor') });

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------
monaco.editor.defineTheme('liveschema-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword',        foreground: '818cf8', fontStyle: 'bold' },  // indigo-400
    { token: 'keyword.sql',    foreground: '818cf8', fontStyle: 'bold' },
    { token: 'type',           foreground: '34d399' },                     // emerald-400
    { token: 'type.sql',       foreground: '34d399' },
    { token: 'string',         foreground: 'f59e0b' },                     // amber-400
    { token: 'string.sql',     foreground: 'f59e0b' },
    { token: 'number',         foreground: 'fb923c' },                     // orange-400
    { token: 'comment',        foreground: '475569', fontStyle: 'italic' }, // slate-600
    { token: 'identifier.sql', foreground: 'e2e8f0' },                     // slate-200
    { token: 'operator',       foreground: 'a78bfa' },                     // violet-400
    { token: 'delimiter',      foreground: '94a3b8' },
  ],
  colors: {
    'editor.background':           '#020617',  // slate-950
    'editor.foreground':           '#e2e8f0',  // slate-200
    'editor.lineHighlightBackground': '#0f172a',
    'editor.selectionBackground':  '#3730a3aa',
    'editorLineNumber.foreground': '#334155',  // slate-700
    'editorLineNumber.activeForeground': '#6366f1',
    'editorCursor.foreground':     '#818cf8',
    'editorIndentGuide.background': '#1e293b',
    'editorIndentGuide.activeBackground': '#334155',
    'editorBracketMatch.background': '#3730a344',
    'editorBracketMatch.border':   '#6366f1',
    'editorWidget.background':     '#0f172a',
    'editorSuggestWidget.background': '#0f172a',
    'editorSuggestWidget.border':  '#1e293b',
    'editorSuggestWidget.selectedBackground': '#1e293b',
    'scrollbar.shadow':            '#00000000',
    'scrollbarSlider.background':  '#33415540',
    'scrollbarSlider.hoverBackground': '#47556960',
  },
});

monaco.editor.defineTheme('liveschema-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword',     foreground: '4338ca', fontStyle: 'bold' },  // indigo-700
    { token: 'keyword.sql', foreground: '4338ca', fontStyle: 'bold' },
    { token: 'type',        foreground: '059669' },                     // emerald-600
    { token: 'type.sql',    foreground: '059669' },
    { token: 'string',      foreground: 'd97706' },                     // amber-600
    { token: 'string.sql',  foreground: 'd97706' },
    { token: 'number',      foreground: 'ea580c' },                     // orange-600
    { token: 'comment',     foreground: '94a3b8', fontStyle: 'italic' },
    { token: 'identifier.sql', foreground: '1e293b' },
    { token: 'operator',    foreground: '7c3aed' },
    { token: 'delimiter',   foreground: '64748b' },
  ],
  colors: {
    'editor.background':           '#ffffff',
    'editor.foreground':           '#1e293b',
    'editor.lineHighlightBackground': '#f8fafc',
    'editor.selectionBackground':  '#c7d2fe80',
    'editorLineNumber.foreground': '#cbd5e1',
    'editorLineNumber.activeForeground': '#4f46e5',
    'editorCursor.foreground':     '#4f46e5',
    'editorBracketMatch.background': '#e0e7ff',
    'editorBracketMatch.border':   '#4f46e5',
    'editorWidget.background':     '#f8fafc',
    'editorSuggestWidget.background': '#f8fafc',
    'editorSuggestWidget.border':  '#e2e8f0',
    'editorSuggestWidget.selectedBackground': '#e0e7ff',
  },
});

// ---------------------------------------------------------------------------
// SQL completions — registered once per page load
// ---------------------------------------------------------------------------
function registerSqlCompletions() {
  // Extended SQL keywords including MySQL / PostgreSQL / SQLite specifics
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW', 'TRIGGER',
    'PROCEDURE', 'FUNCTION', 'DATABASE', 'SCHEMA', 'USE', 'SHOW', 'DESCRIBE',
    'EXPLAIN', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS',
    'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN',
    'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'GROUP', 'BY', 'ORDER',
    'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'TOP', 'WITH',
    'RECURSIVE', 'RETURNING', 'CONFLICT', 'DO', 'NOTHING', 'REPLACE',
    'TRUNCATE', 'COMMIT', 'ROLLBACK', 'BEGIN', 'TRANSACTION', 'SAVEPOINT',
    'GRANT', 'REVOKE', 'PRIVILEGES', 'IF', 'NOT', 'EXISTS', 'CASCADE',
    'RESTRICT', 'NO', 'ACTION', 'REFERENCES', 'FOREIGN', 'KEY', 'PRIMARY',
    'UNIQUE', 'CHECK', 'DEFAULT', 'CONSTRAINT', 'AUTO_INCREMENT', 'SERIAL',
    'GENERATED', 'ALWAYS', 'IDENTITY', 'TEMPORARY', 'TEMP', 'VIRTUAL',
    'STORED', 'OVER', 'PARTITION', 'WINDOW', 'RANK', 'ROW_NUMBER',
    'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE',
    'NTILE', 'CUME_DIST', 'PERCENT_RANK', 'EXTRACT', 'INTERVAL',
  ];

  const typeKeywords = [
    'INT', 'INTEGER', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT',
    'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'REAL',
    'CHAR', 'VARCHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT',
    'BINARY', 'VARBINARY', 'BLOB', 'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB',
    'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR',
    'BOOLEAN', 'BOOL', 'BIT', 'ENUM', 'SET',
    'JSON', 'JSONB', 'ARRAY', 'UUID', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
    'MONEY', 'BYTEA', 'POINT', 'LINE', 'POLYGON', 'GEOMETRY', 'GEOGRAPHY',
    'INTERVAL', 'TSQUERY', 'TSVECTOR', 'XML', 'INET', 'CIDR', 'MACADDR',
    'OID', 'VOID', 'CURSOR',
  ];

  const builtinFunctions = [
    // Aggregate
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUP_CONCAT', 'STRING_AGG',
    'ARRAY_AGG', 'JSON_AGG', 'JSONB_AGG', 'BOOL_AND', 'BOOL_OR',
    // String
    'CONCAT', 'CONCAT_WS', 'LENGTH', 'CHAR_LENGTH', 'UPPER', 'LOWER',
    'TRIM', 'LTRIM', 'RTRIM', 'SUBSTRING', 'SUBSTR', 'LEFT', 'RIGHT',
    'REPLACE', 'INSTR', 'LOCATE', 'POSITION', 'FIND_IN_SET', 'REPEAT',
    'REVERSE', 'SPACE', 'LPAD', 'RPAD', 'FORMAT', 'ASCII', 'CHAR',
    'HEX', 'UNHEX', 'BIN', 'OCT', 'QUOTE', 'SOUNDEX',
    // Numeric
    'ABS', 'CEIL', 'CEILING', 'FLOOR', 'ROUND', 'TRUNCATE', 'MOD',
    'POWER', 'POW', 'SQRT', 'EXP', 'LOG', 'LOG2', 'LOG10',
    'RAND', 'SIGN', 'PI', 'RADIANS', 'DEGREES',
    'SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN', 'ATAN2', 'COT',
    // Date/Time
    'NOW', 'CURDATE', 'CURTIME', 'CURRENT_DATE', 'CURRENT_TIME',
    'CURRENT_TIMESTAMP', 'SYSDATE', 'LOCALTIME', 'LOCALTIMESTAMP',
    'DATE', 'TIME', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
    'DAYOFWEEK', 'DAYOFMONTH', 'DAYOFYEAR', 'WEEKDAY', 'WEEK', 'QUARTER',
    'DATE_ADD', 'DATE_SUB', 'ADDDATE', 'SUBDATE', 'ADDTIME', 'SUBTIME',
    'DATEDIFF', 'TIMEDIFF', 'TIMESTAMPDIFF', 'DATE_FORMAT', 'TIME_FORMAT',
    'STR_TO_DATE', 'UNIX_TIMESTAMP', 'FROM_UNIXTIME', 'EXTRACT',
    'AGE', 'MAKE_DATE', 'MAKE_TIME', 'MAKE_TIMESTAMP',
    // Control flow
    'IF', 'IFNULL', 'NULLIF', 'ISNULL', 'COALESCE', 'GREATEST', 'LEAST',
    'CASE', 'DECODE', 'NVL', 'NVL2', 'IIF',
    // Conversion
    'CAST', 'CONVERT', 'BINARY', 'TO_CHAR', 'TO_DATE', 'TO_NUMBER',
    'TO_TIMESTAMP',
    // Crypto / hash
    'MD5', 'SHA1', 'SHA2', 'SHA256', 'SHA512', 'AES_ENCRYPT', 'AES_DECRYPT',
    'ENCODE', 'DECODE', 'PASSWORD', 'ENCRYPT',
    // JSON
    'JSON_OBJECT', 'JSON_ARRAY', 'JSON_EXTRACT', 'JSON_UNQUOTE',
    'JSON_SET', 'JSON_INSERT', 'JSON_REPLACE', 'JSON_REMOVE',
    'JSON_CONTAINS', 'JSON_SEARCH', 'JSON_KEYS', 'JSON_LENGTH',
    'JSON_TYPE', 'JSON_VALID', 'JSON_ARRAYAGG', 'JSON_OBJECTAGG',
    'JSONB_BUILD_OBJECT', 'JSONB_BUILD_ARRAY', 'JSONB_EXTRACT_PATH',
    // Misc
    'UUID', 'UUID_SHORT', 'LAST_INSERT_ID', 'ROW_COUNT', 'FOUND_ROWS',
    'DATABASE', 'SCHEMA', 'USER', 'VERSION', 'CONNECTION_ID',
    'INET_ATON', 'INET_NTOA', 'INET6_ATON', 'INET6_NTOA',
    'GET_LOCK', 'RELEASE_LOCK', 'IS_FREE_LOCK', 'IS_USED_LOCK',
    'SLEEP', 'BENCHMARK',
  ];

  // Register custom SQL completions
  monaco.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: languages.CompletionItem[] = [
        // Keywords
        ...keywords.map((kw) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        })),
        // Types
        ...typeKeywords.map((t) => ({
          label: t,
          kind: monaco.languages.CompletionItemKind.TypeParameter,
          insertText: t,
          range,
        })),
        // Functions with snippet parens
        ...builtinFunctions.map((fn) => ({
          label: fn,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${fn}($1)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `SQL Function`,
          range,
        })),
        // Common snippets
        {
          label: 'CREATE TABLE',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'CREATE TABLE ${1:nome_tabela} (',
            '  ${2:id} INT AUTO_INCREMENT PRIMARY KEY,',
            '  ${3:coluna} ${4:VARCHAR(100)} NOT NULL',
            ');',
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Cria uma nova tabela',
          range,
        },
        {
          label: 'INSERT INTO',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "INSERT INTO ${1:tabela} (${2:coluna1}, ${3:coluna2}) VALUES\n  ('${4:valor1}', '${5:valor2}');",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Insere dados em uma tabela',
          range,
        },
        {
          label: 'SELECT * FROM',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'SELECT *\nFROM ${1:tabela}\nWHERE ${2:condicao};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Consulta registros de uma tabela',
          range,
        },
        {
          label: 'FOREIGN KEY',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'FOREIGN KEY (${1:coluna_id}) REFERENCES ${2:tabela_pai}(${3:id})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Chave estrangeira',
          range,
        },
        {
          label: 'JOIN',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'JOIN ${1:tabela} ON ${2:tabela}.${3:id} = ${4:outra_tabela}.${5:id}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Inner Join',
          range,
        },
        {
          label: 'LEFT JOIN',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'LEFT JOIN ${1:tabela} ON ${2:tabela}.${3:id} = ${4:outra_tabela}.${5:id}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: 'GROUP BY ... HAVING',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'GROUP BY ${1:coluna}\nHAVING ${2:condicao}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: 'ALTER TABLE ADD COLUMN',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'ALTER TABLE ${1:tabela}\n  ADD COLUMN ${2:coluna} ${3:VARCHAR(100)};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
      ];

      return { suggestions };
    },
  });
}


registerSqlCompletions();
