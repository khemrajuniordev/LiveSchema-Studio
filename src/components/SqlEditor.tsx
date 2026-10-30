import React, { useRef, useState, useEffect, useCallback } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor, languages } from 'monaco-editor';
import {
  Code,
  Sparkles,
  Copy,
  Check,
  PlusCircle,
  Database,
  Trash2,
  FileCode2,
  Plus,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { SqlTab } from '../types/schema';

interface SqlEditorProps {
  tabs: SqlTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, newTitle: string) => void;
  onChangeContent: (content: string) => void;
  onApplyPreset: (presetKey: string) => void;
  tableCount: number;
  theme: 'dark' | 'light';
}

export const PRESETS: Record<string, { label: string; sql: string }> = {
  gamestation: {
    label: '🎮 GameStation (Atividade Triggers)',
    sql: `-- ========================================================
-- Banco de Dados II · Atividade: Triggers no MySQL
-- Cenário: Loja de Games GameStation
-- ========================================================

CREATE TABLE categoria (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL
);

CREATE TABLE jogo (
  id_jogo INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  id_categoria INT NOT NULL REFERENCES categoria(id_categoria),
  plataforma VARCHAR(30) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  estoque INT NOT NULL DEFAULT 0,
  data_cadastro DATETIME,
  data_atualizacao DATETIME
);

CREATE TABLE cliente (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  data_cadastro DATETIME
);

CREATE TABLE venda (
  id_venda INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL REFERENCES cliente(id_cliente),
  data_venda DATETIME NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE item_venda (
  id_item INT AUTO_INCREMENT PRIMARY KEY,
  id_venda INT NOT NULL REFERENCES venda(id_venda),
  id_jogo INT NOT NULL REFERENCES jogo(id_jogo),
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10, 2)
);

CREATE TABLE historico_preco (
  id_historico INT AUTO_INCREMENT PRIMARY KEY,
  id_jogo INT NOT NULL REFERENCES jogo(id_jogo),
  preco_antigo DECIMAL(10, 2) NOT NULL,
  preco_novo DECIMAL(10, 2) NOT NULL,
  data_alteracao DATETIME NOT NULL
);

CREATE TABLE jogo_removido (
  id_jogo INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  estoque INT NOT NULL,
  data_remocao DATETIME NOT NULL
);

INSERT INTO categoria (nome) VALUES 
  ('Ação'),
  ('Esporte'),
  ('RPG');

INSERT INTO jogo (titulo, id_categoria, plataforma, preco, estoque) VALUES 
  ('Cidade Neon', 1, 'PC', 199.90, 10),
  ('Futebol Total 26', 2, 'PS5', 299.90, 25),
  ('Lendas de Aruanda', 3, 'Switch', 149.90, 8),
  ('Corrida Extrema', 2, 'Xbox', 89.90, 3),
  ('Reino Perdido', 3, 'PC', 249.90, 6);

INSERT INTO cliente (nome, email) VALUES 
  ('Ana Souza', 'ANA.SOUZA@EMAIL.COM'),
  ('Bruno Lima', 'bruno.lima@email.com'),
  ('Carla Dias', 'Carla.Dias@Email.com'),
  ('Davi Rocha', 'davi.rocha@email.com');
`,
  },
  ecommerce: {
    label: '🛍️ E-commerce & Pagamentos',
    sql: `-- 🛒 Schema de E-commerce Vivo
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(50) NOT NULL,
  slug VARCHAR(60) UNIQUE
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id),
  title VARCHAR(120) NOT NULL,
  price NUMERIC(10, 2),
  is_active BOOLEAN
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  total_amount NUMERIC(10, 2),
  status VARCHAR(30)
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  product_id INT REFERENCES products(id),
  quantity INT,
  unit_price NUMERIC(10, 2)
);

INSERT INTO users (name, email) VALUES 
  ('Lucas Rossi', 'lucas@exemplo.com'),
  ('Mariana Costa', 'mariana@exemplo.com');
`,
  },
  saas: {
    label: '🏢 SaaS Multi-tenant',
    sql: `-- 🏢 SaaS B2B Multi-inquilino
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  plan VARCHAR(40),
  created_at TIMESTAMP
);

CREATE TABLE members (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  full_name VARCHAR(100),
  role VARCHAR(30)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(80),
  is_archived BOOLEAN
);
`,
  },
};

// ---------------------------------------------------------------------------
// Monaco SQL configuration helper — runs once after Monaco loads
// ---------------------------------------------------------------------------
function configureMonacoSql(monacoInstance: typeof import('monaco-editor')) {
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
  monacoInstance.languages.registerCompletionItemProvider('sql', {
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
          kind: monacoInstance.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        })),
        // Types
        ...typeKeywords.map((t) => ({
          label: t,
          kind: monacoInstance.languages.CompletionItemKind.TypeParameter,
          insertText: t,
          range,
        })),
        // Functions with snippet parens
        ...builtinFunctions.map((fn) => ({
          label: fn,
          kind: monacoInstance.languages.CompletionItemKind.Function,
          insertText: `${fn}($1)`,
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `SQL Function`,
          range,
        })),
        // Common snippets
        {
          label: 'CREATE TABLE',
          kind: monacoInstance.languages.CompletionItemKind.Snippet,
          insertText: [
            'CREATE TABLE ${1:nome_tabela} (',
            '  ${2:id} INT AUTO_INCREMENT PRIMARY KEY,',
            '  ${3:coluna} ${4:VARCHAR(100)} NOT NULL',
            ');',
          ].join('\n'),
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Cria uma nova tabela',
          range,
        },
        {
          label: 'INSERT INTO',
          kind: monacoInstance.languages.CompletionItemKind.Snippet,
          insertText: "INSERT INTO ${1:tabela} (${2:coluna1}, ${3:coluna2}) VALUES\n  ('${4:valor1}', '${5:valor2}');",
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Insere dados em uma tabela',
          range,
        },
        {
          label: 'SELECT * FROM',
          kind: monacoInstance.languages.CompletionItemKind.Snippet,
          insertText: 'SELECT *\nFROM ${1:tabela}\nWHERE ${2:condicao};',
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Consulta registros de uma tabela',
          range,
        },
        {
          label: 'FOREIGN KEY',
          kind: monacoInstance.languages.CompletionItemKind.Snippet,
          insertText: 'FOREIGN KEY (${1:coluna_id}) REFERENCES ${2:tabela_pai}(${3:id})',
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Chave estrangeira',
          range,
        },
        {
          label: 'JOIN',
          kind: monacoInstance.languages.CompletionItemKind.Snippet,
          insertText: 'JOIN ${1:tabela} ON ${2:tabela}.${3:id} = ${4:outra_tabela}.${5:id}',
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Inner Join',
          range,
        },
        {
          label: 'LEFT JOIN',
          kind: monacoInstance.languages.CompletionItemKind.Snippet,
          insertText: 'LEFT JOIN ${1:tabela} ON ${2:tabela}.${3:id} = ${4:outra_tabela}.${5:id}',
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: 'GROUP BY ... HAVING',
          kind: monacoInstance.languages.CompletionItemKind.Snippet,
          insertText: 'GROUP BY ${1:coluna}\nHAVING ${2:condicao}',
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: 'ALTER TABLE ADD COLUMN',
          kind: monacoInstance.languages.CompletionItemKind.Snippet,
          insertText: 'ALTER TABLE ${1:tabela}\n  ADD COLUMN ${2:coluna} ${3:VARCHAR(100)};',
          insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
      ];

      return { suggestions };
    },
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const SqlEditor: React.FC<SqlEditorProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onRenameTab,
  onChangeContent,
  onApplyPreset,
  tableCount,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeContent = activeTab ? activeTab.content : '';

  // Scroll active tab into view
  useEffect(() => {
    const el = document.getElementById(`tab-item-${activeTabId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTabId]);

  // Register completions once Monaco is loaded
  useEffect(() => {
    if (monaco) configureMonacoSql(monaco);
  }, [monaco]);

  // Sync editor content when switching tabs (editor keeps its own model)
  const handleEditorMount = useCallback((ed: editor.IStandaloneCodeEditor) => {
    editorRef.current = ed;
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertSnippet = (text: string) => {
    const ed = editorRef.current;
    if (ed) {
      const pos = ed.getPosition();
      ed.executeEdits('snippet', [{
        range: {
          startLineNumber: pos?.lineNumber ?? 1,
          startColumn: pos?.column ?? 1,
          endLineNumber: pos?.lineNumber ?? 1,
          endColumn: pos?.column ?? 1,
        },
        text,
      }]);
      ed.focus();
    } else {
      onChangeContent(activeContent + text);
    }
  };

  const handleInsertTableSnippet = () => {
    insertSnippet('\nCREATE TABLE nova_tabela (\n  id SERIAL PRIMARY KEY,\n  titulo VARCHAR(100) NOT NULL,\n  criado_em TIMESTAMP\n);\n');
  };

  const handleInsertDataSnippet = () => {
    insertSnippet("\nINSERT INTO tabela (coluna1, coluna2) VALUES ('valor1', 'valor2');\n");
  };

  const startRename = (tab: SqlTab) => {
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const saveRename = () => {
    if (editingTabId && editingTitle.trim()) {
      onRenameTab(editingTabId, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  const scrollTabs = (offset: number) => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Monaco theme names
  const monacoTheme = isDark ? 'liveschema-dark' : 'liveschema-light';

  return (
    <div className={`flex flex-col h-full border-r transition-colors ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Top Bar */}
      <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 ${
        isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-slate-100/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
            <Code className="w-3 h-3" />
          </div>
          <span className={`text-xs font-semibold tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Workspace SQL
          </span>
          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
            isDark
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Reativo ({tableCount} {tableCount === 1 ? 'tabela' : 'tabelas'})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            title="Copiar SQL da aba atual"
            className={`p-1.5 rounded-md transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onChangeContent('')}
            title="Limpar conteúdo da aba"
            className={`p-1.5 rounded-md transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                : 'text-slate-600 hover:text-rose-600 hover:bg-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Header Row */}
      <div className={`px-2 pt-1.5 border-b flex items-center select-none relative gap-1 ${
        isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => scrollTabs(-140)}
          title="Rolar abas para a esquerda"
          className={`p-1 rounded transition-colors shrink-0 ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={tabsContainerRef}
          onWheel={(e) => {
            if (tabsContainerRef.current) {
              e.preventDefault();
              tabsContainerRef.current.scrollLeft += e.deltaY;
            }
          }}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth no-scrollbar py-0.5"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isEditing = editingTabId === tab.id;

            return (
              <div
                id={`tab-item-${tab.id}`}
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                onDoubleClick={() => startRename(tab)}
                className={`shrink-0 whitespace-nowrap group relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-mono cursor-pointer transition-all border-t border-x ${
                  isActive
                    ? isDark
                      ? 'bg-slate-900 text-indigo-300 border-slate-700/90 border-b-2 border-b-indigo-500 shadow-sm'
                      : 'bg-white text-indigo-600 border-slate-300 border-b-2 border-b-indigo-600 shadow-xs'
                    : isDark
                      ? 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
                      : 'bg-slate-100/70 text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />

                {isEditing ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className={`px-1 py-0.5 rounded outline-none w-28 text-xs font-mono border border-indigo-500 ${
                      isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-50 text-slate-900'
                    }`}
                  />
                ) : (
                  <span className="truncate max-w-[150px]" title={tab.title}>{tab.title}</span>
                )}

                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
                    title="Fechar aba"
                    className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ml-1 ${
                      isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-rose-300' : 'hover:bg-slate-200 text-slate-500 hover:text-rose-600'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollTabs(140)}
          title="Rolar abas para a direita"
          className={`p-1 rounded transition-colors shrink-0 ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onAddTab}
          title="Nova Aba de Query"
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border transition-colors ml-1 font-medium shadow-sm ${
            isDark
              ? 'text-slate-200 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/40 border-indigo-500/40'
              : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[11px] font-sans">Nova Aba</span>
        </button>
      </div>

      {/* Preset bar */}
      <div className={`px-3 py-1.5 border-b flex items-center gap-2 overflow-x-auto text-xs ${
        isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50/70 border-slate-200'
      }`}>
        <span className={`text-[10px] flex items-center gap-1 shrink-0 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Sparkles className="w-3 h-3 text-amber-500" />
          Exemplos:
        </span>
        {Object.entries(PRESETS).map(([key, item]) => (
          <button
            key={key}
            type="button"
            onClick={() => onApplyPreset(key)}
            className={`px-2 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap transition-colors ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoSqlEditor
          value={activeContent}
          onChange={onChangeContent}
          theme={monacoTheme}
          isDark={isDark}
          onMount={handleEditorMount}
          key={activeTabId} // remount on tab switch so model is fresh
        />
      </div>

      {/* Quick Insert Footbar */}
      <div className={`px-4 py-2 border-t flex items-center justify-between text-xs ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInsertTableSnippet}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition-colors text-[11px] font-medium ${
              isDark
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <PlusCircle className="w-3 h-3" />
            + Tabela
          </button>
          <button
            type="button"
            onClick={handleInsertDataSnippet}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition-colors text-[11px] font-medium ${
              isDark
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Database className="w-3 h-3" />
            + Inserir Linha
          </button>
        </div>

        <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <FileCode2 className="w-3.5 h-3.5" />
          {activeTab?.title}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Inner Monaco wrapper — isolated so key-based remount stays cheap
// ---------------------------------------------------------------------------
interface MonacoSqlEditorProps {
  value: string;
  onChange: (v: string) => void;
  theme: string;
  isDark: boolean;
  onMount: (ed: editor.IStandaloneCodeEditor) => void;
}

const MonacoSqlEditor: React.FC<MonacoSqlEditorProps> = ({ value, onChange, theme, isDark, onMount }) => {
  const monaco = useMonaco();

  // Define custom themes once Monaco is ready
  useEffect(() => {
    if (!monaco) return;

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

    monaco.editor.setTheme(theme);
  }, [monaco, theme]);

  return (
    <Editor
      height="100%"
      language="sql"
      value={value}
      theme={theme}
      onChange={(v) => onChange(v ?? '')}
      onMount={onMount}
      options={{
        fontSize: 13,
        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", "Menlo", monospace',
        fontLigatures: true,
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: false,
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        acceptSuggestionOnCommitCharacter: true,
        acceptSuggestionOnEnter: 'smart',
        snippetSuggestions: 'top',
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showFunctions: true,
          filterGraceful: true,
          localityBonus: true,
        },
        bracketPairColorization: { enabled: true },
        renderWhitespace: 'none',
        smoothScrolling: true,
        cursorSmoothCaretAnimation: 'on',
        cursorBlinking: 'smooth',
        renderLineHighlight: 'line',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        padding: { top: 12, bottom: 12 },
        contextmenu: true,
        mouseWheelZoom: false,
        colorDecorators: true,
        'semanticHighlighting.enabled': true,
      } as editor.IStandaloneEditorConstructionOptions}
      loading={
        <div className={`w-full h-full flex items-center justify-center text-xs ${isDark ? 'text-slate-500 bg-slate-950' : 'text-slate-400 bg-white'}`}>
          Carregando editor SQL…
        </div>
      }
    />
  );
};
