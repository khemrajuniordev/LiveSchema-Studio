import { useState, useMemo, useCallback, useEffect, useDeferredValue, useRef } from 'react';
import { Header } from './components/Header';
import { SqlEditor } from './components/SqlEditor';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { parseSqlLive } from './engine/sqlParser';
import { CARD_WIDTH, calculateAutoLayout } from './engine/layout';
import { STARTER_SQL, createDefaultTabs } from './data/defaultTabs';
import { PRESETS } from './data/presets';
import { decodeShareHash, encodeShareHash } from './lib/shareLink';
import { STORAGE_KEYS } from './lib/storage';
import type { SqlTab } from './types/schema';

type Positions = Map<string, { x: number; y: number }>;
type LayoutMode = 'split' | 'canvas' | 'editor';

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------
function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage full or blocked */ }
}

function isValidTab(t: unknown): t is SqlTab {
  const tab = t as SqlTab;
  return !!tab && typeof tab.id === 'string' && typeof tab.title === 'string' && typeof tab.content === 'string';
}

function loadTabs(): SqlTab[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(STORAGE_KEYS.tabs) ?? 'null');
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidTab)) return parsed;
  } catch { /* corrupted: fall back to defaults */ }
  return createDefaultTabs();
}

function loadPositions(tabs: SqlTab[]): Positions {
  try {
    const entries: unknown = JSON.parse(readStorage(STORAGE_KEYS.positions) ?? 'null');
    if (Array.isArray(entries) && entries.length > 0) return new Map(entries as [string, { x: number; y: number }][]);
  } catch { /* corrupted: lay out from scratch */ }
  // First visit: start with an organized canvas instead of the fallback grid
  return layoutFor(tabs.map((t) => t.content).join('\n\n'));
}

function layoutFor(sql: string): Positions {
  const { tables, relationships } = parseSqlLive(sql);
  return calculateAutoLayout(tables, relationships);
}

export function App() {
  const [tabs, setTabs] = useState<SqlTab[]>(loadTabs);
  const [activeTabId, setActiveTabId] = useState<string>(() => readStorage(STORAGE_KEYS.activeTab) ?? '');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = readStorage(STORAGE_KEYS.layout);
    return saved === 'split' || saved === 'canvas' || saved === 'editor' ? saved : 'split';
  });
  const [positionsMap, setPositionsMap] = useState<Positions>(() => loadPositions(tabs));
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    readStorage(STORAGE_KEYS.theme) === 'light' ? 'light' : 'dark'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // A saved active tab may no longer exist (closed in another window, corrupted storage…)
  const currentTabId = tabs.some((t) => t.id === activeTabId) ? activeTabId : tabs[0].id;

  const showToast = useCallback((msg: string) => setToastMessage(msg), []);

  // Latest tabs for async callbacks (shared-link import) that shouldn't re-subscribe on every edit
  const tabsRef = useRef(tabs);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Persist workspace
  useEffect(() => writeStorage(STORAGE_KEYS.tabs, JSON.stringify(tabs)), [tabs]);
  useEffect(() => writeStorage(STORAGE_KEYS.activeTab, currentTabId), [currentTabId]);
  useEffect(() => writeStorage(STORAGE_KEYS.layout, layoutMode), [layoutMode]);
  useEffect(() => writeStorage(STORAGE_KEYS.theme, theme), [theme]);

  // Persist table positions (debounced — runs 500 ms after last drag)
  useEffect(() => {
    const id = setTimeout(() => {
      writeStorage(STORAGE_KEYS.positions, JSON.stringify(Array.from(positionsMap.entries())));
    }, 500);
    return () => clearTimeout(id);
  }, [positionsMap]);

  // Shared link: open it as an extra tab instead of replacing the saved workspace
  useEffect(() => {
    let cancelled = false;

    const importFromHash = async () => {
      if (!window.location.hash) return;
      const sql = await decodeShareHash(window.location.hash);
      if (cancelled) return;
      // Drop the hash so a reload doesn't import the same schema again
      history.replaceState(null, '', window.location.pathname + window.location.search);
      if (!sql) {
        showToast('Link compartilhado inválido ou incompleto.');
        return;
      }

      const existing = tabsRef.current.find((t) => t.content === sql);
      if (existing) {
        setActiveTabId(existing.id);
      } else {
        const id = `tab-shared-${Date.now()}`;
        setTabs((prev) => [...prev, { id, title: 'compartilhado.sql', content: sql }]);
        setActiveTabId(id);
      }
      // Place the shared tables that have no position yet, to the right of what's already on the canvas
      setPositionsMap((prev) => {
        const next = new Map(prev);
        const offsetX = prev.size > 0 ? Math.max(...Array.from(prev.values(), (p) => p.x)) + CARD_WIDTH + 90 : 0;
        layoutFor(sql).forEach((pos, key) => {
          if (!next.has(key)) next.set(key, { x: pos.x + offsetX, y: pos.y });
        });
        return next;
      });
      showToast('🔗 Schema compartilhado aberto em uma nova aba.');
    };

    importFromHash();
    window.addEventListener('hashchange', importFromHash);
    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', importFromHash);
    };
  }, [showToast]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  // Combine SQL from all open workspace tabs so the canvas renders full project state
  const combinedSql = useMemo(() => tabs.map((t) => t.content).join('\n\n'), [tabs]);

  // Parsing can lag behind typing on large schemas without blocking the editor
  const deferredSql = useDeferredValue(combinedSql);
  const parseResult = useMemo(() => parseSqlLive(deferredSql), [deferredSql]);

  // Dragging only changes positions, so it doesn't re-parse the SQL
  const tables = useMemo(
    () => parseResult.tables.map((t) => {
      const saved = positionsMap.get(t.id);
      return saved ? { ...t, position: saved } : t;
    }),
    [parseResult.tables, positionsMap]
  );

  const handleChangeContent = (newContent: string) => {
    setTabs((prev) => prev.map((t) => (t.id === currentTabId ? { ...t, content: newContent } : t)));
  };

  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTitle = `query_${tabs.length + 1}.sql`;
    setTabs((prev) => [...prev, { id: newId, title: newTitle, content: `-- Nova Consulta SQL\n` }]);
    setActiveTabId(newId);
    showToast(`Aba "${newTitle}" criada!`);
  };

  const handleCloseTab = (idToClose: string) => {
    if (tabs.length <= 1) return;
    const closedTab = tabs.find((t) => t.id === idToClose);
    if (!closedTab) return;
    if (closedTab.content.trim() && !window.confirm(`Fechar "${closedTab.title}"? O conteúdo desta aba será perdido.`)) {
      return;
    }

    const newTabs = tabs.filter((t) => t.id !== idToClose);
    setTabs(newTabs);
    if (currentTabId === idToClose) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    showToast(`Aba "${closedTab.title}" fechada.`);
  };

  const handleRenameTab = (id: string, newTitle: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));
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
    setPositionsMap(calculateAutoLayout(parseResult.tables, parseResult.relationships));
    showToast('✨ Posições organizadas sem sobreposição!');
  }, [parseResult.tables, parseResult.relationships, showToast]);

  // Anything beyond the untouched starter tab counts as the user's work
  const hasUnsavedWork = () => combinedSql.trim() !== '' && combinedSql !== STARTER_SQL;

  const handleApplyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;

    if (hasUnsavedWork() && !window.confirm(`Carregar "${preset.label}"? As abas abertas serão substituídas.`)) {
      return;
    }

    const id = `tab-${key}-main`;
    setTabs([{ id, title: `${key}_schema.sql`, content: preset.sql }]);
    setActiveTabId(id);
    setPositionsMap(layoutFor(preset.sql));
    showToast(`Carregado: ${preset.label}`);
  };

  // Start over: one blank tab and an empty canvas (theme and layout are kept)
  const handleResetWorkspace = () => {
    if (hasUnsavedWork() && !window.confirm('Limpar tudo? Todas as abas serão apagadas deste navegador.')) return;

    const fresh = createDefaultTabs();
    setTabs(fresh);
    setActiveTabId(fresh[0].id);
    setPositionsMap(new Map());
    showToast('🧹 Workspace limpo.');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${await encodeShareHash(combinedSql)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('🔗 Link do schema copiado para a área de transferência!');
    } catch {
      // Clipboard blocked (permissions, insecure context): let the user copy it by hand
      window.prompt('Copie o link do schema:', url);
    }
  };

  const columnCount = useMemo(() => tables.reduce((acc, t) => acc + t.columns.length, 0), [tables]);
  const rowCount = useMemo(() => tables.reduce((acc, t) => acc + t.rows.length, 0), [tables]);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Application Header */}
      <Header
        tableCount={tables.length}
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
            data-print-hide
            className={`${
              layoutMode === 'split' ? 'w-[42%] min-w-[340px] max-w-[650px]' : 'w-full'
            } h-full z-10 transition-all duration-300`}
          >
            <SqlEditor
              tabs={tabs}
              activeTabId={currentTabId}
              onSelectTab={setActiveTabId}
              onAddTab={handleAddTab}
              onCloseTab={handleCloseTab}
              onRenameTab={handleRenameTab}
              onChangeContent={handleChangeContent}
              onApplyPreset={handleApplyPreset}
              onResetWorkspace={handleResetWorkspace}
              tableCount={tables.length}
              errors={parseResult.errors}
              theme={theme}
            />
          </div>
        )}

        {/* Right Side: Reactive Animated Canvas */}
        {(layoutMode === 'split' || layoutMode === 'canvas') && (
          <div className="flex-1 h-full relative overflow-hidden">
            <InteractiveCanvas
              tables={tables}
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
        <div
          role="status"
          data-print-hide
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-indigo-600/90 text-white text-xs font-medium shadow-2xl backdrop-blur-md border border-indigo-400/40 flex items-center gap-2 animate-bounce"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
