import React from 'react';
import { 
  Database, 
  Sparkles, 
  GitFork, 
  Layers, 
  Maximize, 
  Columns,
  Code2,
  Share2,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  tableCount: number;
  columnCount: number;
  relCount: number;
  rowCount: number;
  layoutMode: 'split' | 'canvas' | 'editor';
  onLayoutChange: (mode: 'split' | 'canvas' | 'editor') => void;
  onShare: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tableCount,
  columnCount,
  relCount,
  rowCount,
  layoutMode,
  onLayoutChange,
  onShare,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      data-print-hide
      className={`h-14 px-4 border-b flex items-center justify-between shrink-0 select-none z-50 transition-colors ${
        isDark
          ? 'bg-slate-950 border-slate-800/80 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Brand & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight font-sans">
                LiveSchema <span className={isDark ? 'text-cyan-400' : 'text-indigo-600'}>Studio</span>
              </h1>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase border ${
                isDark 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                MVP
              </span>
            </div>
            <p className={`text-[11px] leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Visualizador Reativo de Banco de Dados
            </p>
          </div>
        </div>

        <div className={`hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border font-mono ${
            isDark
              ? 'text-slate-400 bg-slate-900/80 border-slate-800'
              : 'text-slate-600 bg-slate-100 border-slate-200'
          }`}>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{tableCount} tabelas</span>
          </div>
          <div className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border font-mono ${
            isDark
              ? 'text-slate-400 bg-slate-900/80 border-slate-800'
              : 'text-slate-600 bg-slate-100 border-slate-200'
          }`}>
            <span>{columnCount} colunas</span>
          </div>
          <div className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border font-mono ${
            isDark
              ? 'text-slate-400 bg-slate-900/80 border-slate-800'
              : 'text-slate-600 bg-slate-100 border-slate-200'
          }`}>
            <GitFork className="w-3.5 h-3.5 text-cyan-500" />
            <span>{relCount} relações</span>
          </div>
          {rowCount > 0 && (
            <div className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border font-mono ${
              isDark
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{rowCount} linhas vivas</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-indigo-600 hover:text-indigo-800 hover:bg-slate-200'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Layout Mode Switcher */}
        <div className={`flex items-center p-1 rounded-lg border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => onLayoutChange('editor')}
            title="Apenas Editor SQL"
            className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 font-medium ${
              layoutMode === 'editor'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor</span>
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange('split')}
            title="Dividir Tela (Editor + Canvas)"
            className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 font-medium ${
              layoutMode === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dividido</span>
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange('canvas')}
            title="Apenas Canvas Visual"
            className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 font-medium ${
              layoutMode === 'canvas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Canvas</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Compartilhar</span>
        </button>
      </div>
    </header>
  );
};
