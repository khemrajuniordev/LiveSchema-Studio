import React from 'react';
import { AlertTriangle, CircleSlash, Table2, X } from 'lucide-react';
import type { RunItem, RunResult } from '../engine/sqlRunner';

const MAX_ROWS = 100;

interface ResultsPanelProps {
  result: RunResult;
  isDark: boolean;
  onClose: () => void;
}

// Output of "Executar": SELECT tables, errors and skipped statements; plain successes are only counted
export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, isDark, onClose }) => {
  const shown = result.items.filter((i) => i.kind !== 'ok');
  const okCount = result.items.filter((i) => i.kind === 'ok' || i.kind === 'rows').length;
  const errorCount = result.items.filter((i) => i.kind === 'error').length;
  const changed = result.items.reduce((sum, i) => sum + (i.kind === 'ok' && i.changes > 0 ? i.changes : 0), 0);
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex flex-col max-h-[45%] min-h-[120px] border-t select-text ${
      isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className={`px-4 py-1.5 flex items-center justify-between text-[11px] border-b ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <span className={muted}>
          <span className="font-semibold">Resultados</span> · {okCount} {okCount === 1 ? 'comando executado' : 'comandos executados'}
          {changed > 0 && ` · ${changed} ${changed === 1 ? 'linha alterada' : 'linhas alteradas'}`}
          {errorCount > 0 && <span className="text-rose-500"> · {errorCount} {errorCount === 1 ? 'erro' : 'erros'}</span>}
          {` · ${result.ms} ms · SQLite`}
        </span>
        <button type="button" onClick={onClose} title="Fechar resultados" className={`p-1 rounded ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {shown.length === 0 && (
          <p className={`text-xs ${muted}`}>Tudo executado sem erros. Escreva um SELECT para ver dados aqui.</p>
        )}
        {shown.map((item, i) => (
          <ResultItem key={i} item={item} isDark={isDark} />
        ))}
      </div>
    </div>
  );
};

const ResultItem: React.FC<{ item: RunItem; isDark: boolean }> = ({ item, isDark }) => {
  const where = `${item.tab} · linha ${item.line}`;
  const sqlPreview = item.sql.replace(/\s+/g, ' ').slice(0, 90) + (item.sql.length > 90 ? '…' : '');
  const header = (icon: React.ReactNode, color: string) => (
    <div className={`flex items-center gap-1.5 text-[11px] mb-1 ${color}`}>
      {icon}
      <span className="font-mono truncate" title={item.sql}>{sqlPreview}</span>
      <span className={`ml-auto shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{where}</span>
    </div>
  );

  if (item.kind === 'error') {
    return (
      <div>
        {header(<AlertTriangle className="w-3.5 h-3.5 shrink-0" />, 'text-rose-500')}
        <p className={`text-xs rounded-md border px-2.5 py-1.5 ${
          isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>{item.message}</p>
      </div>
    );
  }

  if (item.kind === 'skipped') {
    return (
      <div>
        {header(<CircleSlash className="w-3.5 h-3.5 shrink-0" />, isDark ? 'text-amber-300' : 'text-amber-700')}
        <p className={`text-xs ${isDark ? 'text-amber-200/80' : 'text-amber-700'}`}>{item.message}</p>
      </div>
    );
  }

  if (item.kind !== 'rows') return null;
  const rows = item.rows.slice(0, MAX_ROWS);
  const cell = `px-2 py-1 border-b whitespace-nowrap ${isDark ? 'border-slate-800' : 'border-slate-100'}`;

  return (
    <div>
      {header(<Table2 className="w-3.5 h-3.5 shrink-0" />, isDark ? 'text-indigo-300' : 'text-indigo-700')}
      <div className={`overflow-auto rounded-md border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <table className="text-[11px] font-mono w-full">
          <thead className={isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-700'}>
            <tr>{item.columns.map((c, i) => <th key={i} className={`${cell} text-left font-semibold`}>{c}</th>)}</tr>
          </thead>
          <tbody className={isDark ? 'text-slate-200' : 'text-slate-800'}>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((v, c) => (
                  <td key={c} className={cell}>
                    {v === null ? <em className="text-slate-400">NULL</em> : v instanceof Uint8Array ? `(${v.length} bytes)` : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`mt-1 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {item.rows.length === 0
          ? 'Nenhuma linha.'
          : item.rows.length > MAX_ROWS
            ? `Mostrando ${MAX_ROWS} de ${item.rows.length} linhas.`
            : `${item.rows.length} ${item.rows.length === 1 ? 'linha' : 'linhas'}.`}
      </p>
    </div>
  );
};
