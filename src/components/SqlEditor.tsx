import React, { useRef, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { editor } from 'monaco-editor';
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
  AlertTriangle,
  RotateCcw,
  Download,
  Play,
  Loader2,
} from 'lucide-react';
import type { SqlTab } from '../types/schema';
import { PRESETS } from '../data/presets';
import { ExportDialog } from './ExportDialog';
import { ResultsPanel } from './ResultsPanel';
import type { RunResult } from '../engine/sqlRunner';

// Monaco is the heaviest dependency by far: load it after the shell and canvas are on screen
const MonacoSqlEditor = lazy(() => import('./editor/MonacoSqlEditor'));

interface SqlEditorProps {
  tabs: SqlTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, newTitle: string) => void;
  onChangeContent: (content: string) => void;
  onApplyPreset: (presetKey: string) => void;
  onResetWorkspace: () => void;
  tableCount: number;
  /** Parser warnings for the whole workspace */
  errors: string[];
  theme: 'dark' | 'light';
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
  onResetWorkspace,
  tableCount,
  errors,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeContent = activeTab ? activeTab.content : '';

  // Vertical wheel scrolls the tab strip; React's onWheel is passive and can't preventDefault
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Scroll active tab into view
  useEffect(() => {
    const el = document.getElementById(`tab-item-${activeTabId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTabId]);


  // Run every tab, in order, on a fresh in-browser SQLite (loaded on first use)
  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    try {
      const { runWorkspace } = await import('../engine/sqlRunner');
      setRunResult(await runWorkspace(tabs));
    } catch (err) {
      setRunResult({ ms: 0, items: [{ kind: 'error', tab: '', line: 0, sql: '', message: `Não foi possível iniciar o banco: ${String(err)}` }] });
    } finally {
      setRunning(false);
    }
  };
  // Ctrl/Cmd+Enter in Monaco calls the latest handleRun
  const runRef = useRef(handleRun);
  useEffect(() => { runRef.current = handleRun; });

  // Sync editor content when switching tabs (editor keeps its own model)
  const handleEditorMount = useCallback((ed: editor.IStandaloneCodeEditor) => {
    editorRef.current = ed;
    // KeyMod.CtrlCmd | KeyCode.Enter, as numbers so the monaco module stays out of this chunk
    ed.addCommand(2048 | 3, () => runRef.current());
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: select everything so Ctrl+C works
      const ed = editorRef.current;
      const model = ed?.getModel();
      if (ed && model) {
        ed.setSelection(model.getFullModelRange());
        ed.focus();
      }
    }
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
          <span className={`text-xs font-semibold tracking-wide whitespace-nowrap ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Workspace SQL
          </span>
          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border whitespace-nowrap ${
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
            onClick={handleRun}
            disabled={running}
            title="Executar todas as abas num banco SQLite (Ctrl+Enter)"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span className="whitespace-nowrap">Executar</span>
          </button>
          <button
            type="button"
            onClick={() => setShowExport(true)}
            title="Exportar as abas como um arquivo .sql"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              isDark
                ? 'text-indigo-300 hover:text-white hover:bg-slate-800'
                : 'text-indigo-700 hover:text-indigo-900 hover:bg-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Exportar</span>
          </button>
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
            onClick={onResetWorkspace}
            title="Limpar tudo: começar um workspace novo"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                : 'text-slate-600 hover:text-rose-600 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline whitespace-nowrap">Limpar tudo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeContent.trim() && !window.confirm('Apagar todo o conteúdo desta aba?')) return;
              onChangeContent('');
            }}
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
        <Suspense
          fallback={
            <div className={`w-full h-full flex items-center justify-center text-xs ${isDark ? 'text-slate-500 bg-slate-950' : 'text-slate-400 bg-white'}`}>
              Carregando editor SQL…
            </div>
          }
        >
          <MonacoSqlEditor
            value={activeContent}
            onChange={onChangeContent}
            theme={monacoTheme}
            isDark={isDark}
            onMount={handleEditorMount}
            key={activeTabId} // remount on tab switch so model is fresh
          />
        </Suspense>
      </div>

      {runResult && (
        <ResultsPanel result={runResult} isDark={isDark} onClose={() => setRunResult(null)} />
      )}

      {/* Parser warnings */}
      {showErrors && errors.length > 0 && (
        <div className={`max-h-40 overflow-y-auto border-t px-4 py-2 space-y-1 text-[11px] font-mono select-text ${
          isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {errors.map((msg, i) => (
            <div key={i} className="flex gap-2">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

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

        <div className="flex items-center gap-3 min-w-0">
          {errors.length > 0 && (
            <button
              type="button"
              onClick={() => setShowErrors((v) => !v)}
              title={showErrors ? 'Esconder avisos' : 'Ver avisos do SQL'}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors ${
                isDark
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              {errors.length} {errors.length === 1 ? 'aviso' : 'avisos'}
            </button>
          )}
          <span className={`text-[11px] flex items-center gap-1 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <FileCode2 className="w-3.5 h-3.5 shrink-0" />
            {activeTab?.title}
          </span>
        </div>
      </div>

      {showExport && (
        <ExportDialog tabs={tabs} theme={theme} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
};
