import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowDown, ArrowUp, Check, Copy, Download, FileText, X } from 'lucide-react';
import type { SqlTab } from '../types/schema';
import { buildSqlExport, downloadTextFile, isValidDatabaseName, toSqlFileName } from '../lib/sqlExport';

interface ExportDialogProps {
  tabs: SqlTab[];
  theme: 'dark' | 'light';
  onClose: () => void;
}

// Mounted only while open, so every opening starts from the current tabs
export const ExportDialog: React.FC<ExportDialogProps> = ({ tabs, theme, onClose }) => {
  const isDark = theme === 'dark';
  const [order, setOrder] = useState<string[]>(() => tabs.map((t) => t.id));
  const [selected, setSelected] = useState<Set<string>>(() => new Set(tabs.map((t) => t.id)));
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeTabTitles, setIncludeTabTitles] = useState(true);
  const [createDatabase, setCreateDatabase] = useState(false);
  const [databaseName, setDatabaseName] = useState('meu_banco');
  const [fileName, setFileName] = useState(() => (tabs.length === 1 ? tabs[0].title : 'liveschema'));
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const tabById = useMemo(() => new Map(tabs.map((t) => [t.id, t])), [tabs]);
  const orderedTabs = useMemo(
    () => order.map((id) => tabById.get(id)).filter((t): t is SqlTab => !!t),
    [order, tabById]
  );
  const exportedTabs = useMemo(() => orderedTabs.filter((t) => selected.has(t.id)), [orderedTabs, selected]);

  const result = useMemo(
    () => buildSqlExport({
      tabs: exportedTabs,
      includeHeader,
      includeTabTitles,
      databaseName: createDatabase ? databaseName : '',
    }),
    [exportedTabs, includeHeader, includeTabTitles, createDatabase, databaseName]
  );

  // Focus the dialog once so keyboard users land inside it
  useEffect(() => { dialogRef.current?.focus(); }, []);

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const move = (index: number, delta: number) => {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleDownload = () => {
    downloadTextFile(toSqlFileName(fileName), result.sql);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copie o SQL:', result.sql);
    }
  };

  const nothingSelected = exportedTabs.length === 0;
  const dbNameInvalid = createDatabase && !isValidDatabaseName(databaseName.trim());

  const panel = isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const field = isDark
    ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-500'
    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500';
  const iconBtn = `p-1 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none ${
    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
  }`;

  // Portal: the editor column is its own stacking context, which would put the header above the overlay
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        tabIndex={-1}
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl outline-none select-text ${panel}`}
      >
        {/* Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h2 id="export-title" className="text-sm font-semibold">Exportar arquivo .sql</h2>
            <p className={`text-[11px] ${muted}`}>Junta as abas escolhidas, na ordem abaixo, em um único script.</p>
          </div>
          <button type="button" onClick={onClose} title="Fechar (Esc)" className={iconBtn}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] overflow-y-auto md:overflow-hidden">
          {/* Options */}
          <div className={`p-5 space-y-5 md:overflow-y-auto md:border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <section>
              <h3 className="text-xs font-semibold mb-1">Abas e ordem</h3>
              <p className={`text-[11px] mb-2 ${muted}`}>Crie as tabelas antes dos INSERTs e das consultas.</p>
              <ol className="space-y-1">
                {orderedTabs.map((tab, i) => (
                  <li
                    key={tab.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs ${
                      isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(tab.id)}
                      onChange={() => toggle(tab.id)}
                      aria-label={`Incluir ${tab.title}`}
                      className="accent-indigo-600"
                    />
                    <span className={`w-4 text-right font-mono ${muted}`}>{i + 1}</span>
                    <FileText className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                    <span className={`flex-1 truncate font-mono ${selected.has(tab.id) ? '' : `line-through ${muted}`}`} title={tab.title}>
                      {tab.title}
                    </span>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Subir" className={iconBtn}>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === orderedTabs.length - 1} title="Descer" className={iconBtn}>
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            <section className="space-y-2 text-xs">
              <h3 className="font-semibold">Opções</h3>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeHeader} onChange={(e) => setIncludeHeader(e.target.checked)} className="accent-indigo-600" />
                Comentário de cabeçalho (data e abas)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeTabTitles} onChange={(e) => setIncludeTabTitles(e.target.checked)} className="accent-indigo-600" />
                Separar cada aba com um comentário
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={createDatabase} onChange={(e) => setCreateDatabase(e.target.checked)} className="accent-indigo-600" />
                <span>Criar o banco no início <span className={muted}>(CREATE DATABASE + USE, MySQL)</span></span>
              </label>
              {createDatabase && (
                <input
                  type="text"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  aria-label="Nome do banco"
                  aria-invalid={dbNameInvalid}
                  className={`ml-6 w-[calc(100%-1.5rem)] px-2 py-1 rounded-md border font-mono text-xs outline-none ${field} ${dbNameInvalid ? '!border-rose-500' : ''}`}
                />
              )}
            </section>

            <section className="space-y-1 text-xs">
              <h3 className="font-semibold">Nome do arquivo</h3>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={fileName.replace(/\.sql$/i, '')}
                  onChange={(e) => setFileName(e.target.value)}
                  aria-label="Nome do arquivo"
                  className={`flex-1 min-w-0 px-2 py-1 rounded-md border font-mono text-xs outline-none ${field}`}
                />
                <span className={`font-mono ${muted}`}>.sql</span>
              </div>
            </section>
          </div>

          {/* Preview */}
          <div className="p-5 flex flex-col min-h-[240px] md:min-h-0 gap-2">
            <h3 className="text-xs font-semibold">Prévia</h3>
            {result.warnings.length > 0 && (
              <ul className={`space-y-1 text-[11px] rounded-lg border px-3 py-2 ${
                isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {result.warnings.map((w, i) => (
                  <li key={i} className="flex gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
            <pre className={`flex-1 min-h-0 overflow-auto rounded-lg border p-3 text-[11px] leading-relaxed font-mono whitespace-pre ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {nothingSelected ? '-- Nenhuma aba selecionada' : result.sql}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex items-center justify-end gap-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={handleCopy}
            disabled={nothingSelected}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors disabled:opacity-40 ${
              isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={nothingSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar {toSqlFileName(fileName)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
