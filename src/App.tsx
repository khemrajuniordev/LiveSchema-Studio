import { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SqlEditor, PRESETS } from './components/SqlEditor';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { parseSqlLive } from './engine/sqlParser';
import { calculateAutoLayout } from './engine/layout';
import type { SqlTab } from './types/schema';

const DEFAULT_TABS: SqlTab[] = [
  {
    id: 'tab-schema',
    title: '1_schema.sql',
    content: `-- ========================================================
-- Banco de Dados II · Atividade: Triggers no MySQL
-- Parte 1: DDL – Criação do Banco e das Tabelas
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
`,
  },
  {
    id: 'tab-dados',
    title: '2_dados_iniciais.sql',
    content: `-- ========================================================
-- Parte 2: DML – Inserção dos Dados Iniciais
-- ========================================================

-- Categorias
INSERT INTO categoria (nome) VALUES 
  ('Ação'),
  ('Esporte'),
  ('RPG');

-- Jogos
INSERT INTO jogo (titulo, id_categoria, plataforma, preco, estoque) VALUES 
  ('Cidade Neon', 1, 'PC', 199.90, 10),
  ('Futebol Total 26', 2, 'PS5', 299.90, 25),
  ('Lendas de Aruanda', 3, 'Switch', 149.90, 8),
  ('Corrida Extrema', 2, 'Xbox', 89.90, 3),
  ('Reino Perdido', 3, 'PC', 249.90, 6);

-- Clientes
INSERT INTO cliente (nome, email) VALUES 
  ('Ana Souza', 'ANA.SOUZA@EMAIL.COM'),
  ('Bruno Lima', 'bruno.lima@email.com'),
  ('Carla Dias', 'Carla.Dias@Email.com'),
  ('Davi Rocha', 'davi.rocha@email.com');

-- Vendas de Apoio
INSERT INTO venda (id_cliente, data_venda, valor_total) VALUES 
  (1, '2026-10-29 14:00:00', 549.70);

INSERT INTO item_venda (id_venda, id_jogo, quantidade, preco_unitario) VALUES 
  (1, 1, 2, 199.90),
  (1, 3, 1, 149.90);
`,
  },
  {
    id: 'tab-queries',
    title: '3_consultas.sql',
    content: `-- ========================================================
-- Parte 5: Validar os Triggers com Consultas
-- ========================================================

-- Teste 3: Conferir se data_cadastro foi preenchida nos jogos
SELECT * FROM jogo;

-- Teste 4: Conferir como ficaram os e-mails dos clientes
SELECT * FROM cliente;

-- Teste 7: Venda completa com joins de itens e jogos
SELECT 
  v.id_venda, 
  c.nome AS cliente, 
  v.valor_total, 
  j.titulo AS jogo, 
  iv.quantidade, 
  iv.preco_unitario
FROM venda v
JOIN cliente c ON v.id_cliente = c.id_cliente
JOIN item_venda iv ON v.id_venda = iv.id_venda
JOIN jogo j ON iv.id_jogo = j.id_jogo;
`,
  },
];

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------
const LS_TABS       = 'liveschema_tabs';
const LS_ACTIVE_TAB = 'liveschema_active_tab';
const LS_POSITIONS  = 'liveschema_positions';
const LS_LAYOUT     = 'liveschema_layout';

function loadTabs(): SqlTab[] {
  // URL hash (shared link) takes priority
  try {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decoded = decodeURIComponent(atob(hash));
      if (decoded) return [{ id: 'tab-shared', title: 'schema.sql', content: decoded }];
    }
  } catch { /* ignore */ }

  // Saved workspace
  try {
    const raw = localStorage.getItem(LS_TABS);
    if (raw) {
      const parsed = JSON.parse(raw) as SqlTab[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }

  return DEFAULT_TABS;
}

function loadPositions(): Map<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(LS_POSITIONS);
    if (raw) {
      const entries = JSON.parse(raw) as [string, { x: number; y: number }][];
      return new Map(entries);
    }
  } catch { /* ignore */ }
  return new Map();
}

export function App() {
  const [tabs, setTabs] = useState<SqlTab[]>(loadTabs);
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_ACTIVE_TAB) || tabs[0]?.id || 'tab-schema';
    } catch { return tabs[0]?.id || 'tab-schema'; }
  });
  const [layoutMode, setLayoutMode] = useState<'split' | 'canvas' | 'editor'>(() => {
    try {
      const saved = localStorage.getItem(LS_LAYOUT);
      if (saved === 'split' || saved === 'canvas' || saved === 'editor') return saved;
    } catch { /* ignore */ }
    return 'split';
  });
  const [positionsMap, setPositionsMap] = useState<Map<string, { x: number; y: number }>>(loadPositions);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist tabs whenever they change
  useEffect(() => {
    try { localStorage.setItem(LS_TABS, JSON.stringify(tabs)); } catch { /* ignore */ }
  }, [tabs]);

  // Persist active tab
  useEffect(() => {
    try { localStorage.setItem(LS_ACTIVE_TAB, activeTabId); } catch { /* ignore */ }
  }, [activeTabId]);

  // Persist layout mode
  useEffect(() => {
    try { localStorage.setItem(LS_LAYOUT, layoutMode); } catch { /* ignore */ }
  }, [layoutMode]);

  // Persist table positions (throttled via debounce — runs 500 ms after last drag)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(LS_POSITIONS, JSON.stringify(Array.from(positionsMap.entries())));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(id);
  }, [positionsMap]);

  // Theme state: dark / light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('liveschema_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('liveschema_theme', next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Combine SQL from all open workspace tabs so the canvas renders full project state
  const combinedSql = useMemo(() => {
    return tabs.map((t) => t.content).join('\n\n');
  }, [tabs]);

  // Parse SQL reactively on every keystroke
  const parseResult = useMemo(() => {
    return parseSqlLive(combinedSql, positionsMap);
  }, [combinedSql, positionsMap]);

  // Change content of currently active tab
  const handleChangeContent = (newContent: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, content: newContent } : t))
    );
  };

  // Add new query tab
  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTitle = `query_${tabs.length + 1}.sql`;
    const newTab: SqlTab = {
      id: newId,
      title: newTitle,
      content: `-- Nova Consulta SQL\nSELECT * FROM usuarios;\n`,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    showToast(`Aba "${newTitle}" criada!`);
  };

  // Close tab
  const handleCloseTab = (idToClose: string) => {
    if (tabs.length <= 1) return;
    const closedTab = tabs.find((t) => t.id === idToClose);
    const newTabs = tabs.filter((t) => t.id !== idToClose);
    setTabs(newTabs);

    if (activeTabId === idToClose) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    showToast(`Aba "${closedTab?.title}" fechada.`);
  };

  // Rename tab
  const handleRenameTab = (id: string, newTitle: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
  };

  // Keep track of positions so typing doesn't reset user drags
  const handleTablePositionChange = useCallback((id: string, x: number, y: number) => {
    setPositionsMap((prev) => {
      const next = new Map(prev);
      next.set(id.toLowerCase(), { x, y });
      return next;
    });
  }, []);

  // Auto Layout action: calculates dynamic heights and places tables without any collision
  const handleAutoLayout = useCallback(() => {
    const newPositions = calculateAutoLayout(parseResult.tables, parseResult.relationships);
    setPositionsMap(newPositions);
    showToast('✨ Posições organizadas sem sobreposição!');
  }, [parseResult.tables, parseResult.relationships]);

  // Apply template preset
  const handleApplyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (preset) {
      const newPositions = new Map();
      setPositionsMap(newPositions);
      try { localStorage.setItem(LS_POSITIONS, '[]'); } catch { /* ignore */ }
      const newTabs = [
        {
          id: `tab-${key}-main`,
          title: `${key}_schema.sql`,
          content: preset.sql,
        },
      ];
      setTabs(newTabs);
      setActiveTabId(`tab-${key}-main`);
      showToast(`Carregado: ${preset.label}`);
    }
  };

  // Share link
  const handleShare = () => {
    try {
      const encoded = btoa(encodeURIComponent(combinedSql));
      window.location.hash = encoded;
      navigator.clipboard.writeText(window.location.href);
      showToast('🔗 Link do schema copiado para a área de transferência!');
    } catch {
      showToast('Erro ao gerar link compartilhável');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const columnCount = useMemo(() => {
    return parseResult.tables.reduce((acc, t) => acc + t.columns.length, 0);
  }, [parseResult.tables]);

  const rowCount = useMemo(() => {
    return parseResult.tables.reduce((acc, t) => acc + t.rows.length, 0);
  }, [parseResult.tables]);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Application Header */}
      <Header
        tableCount={parseResult.tables.length}
        columnCount={columnCount}
        relCount={parseResult.relationships.length}
        rowCount={rowCount}
        layoutMode={layoutMode}
        onLayoutChange={setLayoutMode}
        onShare={handleShare}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Live SQL Editor with Multi-tab support */}
        {(layoutMode === 'split' || layoutMode === 'editor') && (
          <div
            className={`${
              layoutMode === 'split' ? 'w-[42%] min-w-[340px] max-w-[650px]' : 'w-full'
            } h-full z-10 transition-all duration-300`}
          >
            <SqlEditor
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onAddTab={handleAddTab}
              onCloseTab={handleCloseTab}
              onRenameTab={handleRenameTab}
              onChangeContent={handleChangeContent}
              onApplyPreset={handleApplyPreset}
              tableCount={parseResult.tables.length}
              theme={theme}
            />
          </div>
        )}

        {/* Right Side: Reactive Animated Canvas */}
        {(layoutMode === 'split' || layoutMode === 'canvas') && (
          <div className="flex-1 h-full relative overflow-hidden">
            <InteractiveCanvas
              tables={parseResult.tables}
              relationships={parseResult.relationships}
              onTablePositionChange={handleTablePositionChange}
              onAutoLayout={handleAutoLayout}
              theme={theme}
            />
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-indigo-600/90 text-white text-xs font-medium shadow-2xl backdrop-blur-md border border-indigo-400/40 flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
