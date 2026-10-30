import React, { useState } from 'react';
import { 
  Key, 
  Link2, 
  Hash, 
  Type, 
  Calendar, 
  ToggleLeft, 
  Code2, 
  HelpCircle,
  Table as TableIcon,
  Eye,
  Rows
} from 'lucide-react';
import type { ColumnCategory, Table } from '../types/schema';
import {
  CARD_BODY_PADDING,
  CARD_FOOTER_HEIGHT,
  CARD_HEADER_HEIGHT,
  CARD_ROW_GAP,
  CARD_ROW_HEIGHT,
  CARD_WIDTH,
} from '../engine/layout';

interface FloatingTableCardProps {
  table: Table;
  isSelected: boolean;
  onSelect: () => void;
  onStartDrag: (e: React.PointerEvent, id: string, initX: number, initY: number) => void;
  theme?: 'dark' | 'light';
}

const CATEGORY_CONFIG_DARK: Record<ColumnCategory, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  key: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: <Key className="w-3.5 h-3.5" />,
    label: 'PK/FK',
  },
  numeric: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: <Hash className="w-3.5 h-3.5" />,
    label: 'NUM',
  },
  text: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: <Type className="w-3.5 h-3.5" />,
    label: 'TXT',
  },
  datetime: {
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: <Calendar className="w-3.5 h-3.5" />,
    label: 'DATE',
  },
  boolean: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: <ToggleLeft className="w-3.5 h-3.5" />,
    label: 'BOOL',
  },
  json: {
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    icon: <Code2 className="w-3.5 h-3.5" />,
    label: 'JSON',
  },
  other: {
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    label: 'RAW',
  },
};

const CATEGORY_CONFIG_LIGHT: Record<ColumnCategory, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  key: {
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <Key className="w-3.5 h-3.5 text-amber-600" />,
    label: 'PK/FK',
  },
  numeric: {
    color: 'text-cyan-800',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    icon: <Hash className="w-3.5 h-3.5 text-cyan-600" />,
    label: 'NUM',
  },
  text: {
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <Type className="w-3.5 h-3.5 text-emerald-600" />,
    label: 'TXT',
  },
  datetime: {
    color: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: <Calendar className="w-3.5 h-3.5 text-purple-600" />,
    label: 'DATE',
  },
  boolean: {
    color: 'text-orange-800',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: <ToggleLeft className="w-3.5 h-3.5 text-orange-600" />,
    label: 'BOOL',
  },
  json: {
    color: 'text-pink-800',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    icon: <Code2 className="w-3.5 h-3.5 text-pink-600" />,
    label: 'JSON',
  },
  other: {
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500" />,
    label: 'RAW',
  },
};

export const FloatingTableCard: React.FC<FloatingTableCardProps> = ({
  table,
  isSelected,
  onSelect,
  onStartDrag,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'schema' | 'preview'>('schema');
  const catConfig = isDark ? CATEGORY_CONFIG_DARK : CATEGORY_CONFIG_LIGHT;

  return (
    <div
      onPointerDown={(e) => onStartDrag(e, table.id, table.position.x, table.position.y)}
      onClick={onSelect}
      style={{
        position: 'absolute',
        transform: `translate3d(${table.position.x}px, ${table.position.y}px, 0)`,
        zIndex: isSelected ? 30 : 10,
        willChange: 'transform',
        width: CARD_WIDTH,
      }}
      className={`rounded-2xl select-none transition-shadow duration-200 ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-2xl shadow-indigo-500/25'
          : isDark 
            ? 'hover:ring-1 hover:ring-slate-600 shadow-xl shadow-black/50' 
            : 'hover:ring-1 hover:ring-slate-300 shadow-xl shadow-slate-200/60'
      } ${isDark ? 'glass-card-dark text-slate-100' : 'glass-card-light text-slate-900'} overflow-hidden cursor-grab active:cursor-grabbing`}
    >
      {/* Table Header — fixed height keeps the FK wire anchors (engine/layout) aligned */}
      <div style={{ height: CARD_HEADER_HEIGHT }} className={`px-4 border-b flex items-center justify-between ${
        isDark 
          ? 'bg-gradient-to-r from-slate-800/95 via-slate-800/60 to-slate-900/95 border-slate-700/60' 
          : 'bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5 pointer-events-none">
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
            isDark 
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-600'
          }`}>
            <TableIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`font-semibold text-sm tracking-wide font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {table.name}
            </h3>
            <span className={`text-[10px] font-sans block -mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {table.columns.length} atributos • {table.rows.length} {table.rows.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
        </div>

        {/* View Switcher: Schema vs Live Peek */}
        <div className={`flex items-center p-0.5 rounded-lg border ${
          isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-slate-200/80 border-slate-300/80'
        }`}>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('schema');
            }}
            title="Ver Colunas e Tipos"
            className={`p-1.5 rounded-md text-xs transition-colors ${
              activeTab === 'schema'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Rows className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('preview');
            }}
            title="Amostra Viva de Dados"
            className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {table.rows.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Body: Schema Attributes View - Fits all columns without scrollbar */}
      {activeTab === 'schema' && (
        <div
          style={{ padding: CARD_BODY_PADDING, display: 'flex', flexDirection: 'column', gap: CARD_ROW_GAP }}
          className="pointer-events-auto"
        >
          {table.columns.length === 0 ? (
            <div className={`py-6 text-center text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Aguardando definição de colunas...
            </div>
          ) : (
            table.columns.map((col) => {
              const cfg = catConfig[col.category] || catConfig.other;

              return (
                <div
                  key={col.id}
                  id={`port-${table.name}-${col.name}`}
                  style={{ height: CARD_ROW_HEIGHT }}
                  className={`group relative flex items-center justify-between px-2.5 rounded-lg transition-colors border border-transparent ${
                    isDark 
                      ? 'hover:bg-slate-700/40 hover:border-slate-700/50' 
                      : 'hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Left: Key indicator and Column Name */}
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {col.isPrimaryKey ? (
                      <span title="Chave Primária" className="text-amber-500">
                        <Key className="w-3.5 h-3.5" />
                      </span>
                    ) : col.isForeignKey ? (
                      <span title={`Chave Estrangeira ➔ ${col.fkTarget?.table}.${col.fkTarget?.column}`} className="text-cyan-500">
                        <Link2 className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className={`w-3.5 h-3.5 rounded-full border inline-block ${
                        isDark ? 'bg-slate-700/60 border-slate-600/40' : 'bg-slate-200 border-slate-300'
                      }`} />
                    )}

                    <span className={`text-xs font-mono font-medium truncate ${
                      isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950'
                    }`}>
                      {col.name}
                    </span>
                  </div>

                  {/* Right: Badges (Type & Modifiers) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {col.sampleValues && col.sampleValues.length > 0 && (
                      <span
                        title={`Amostras: ${col.sampleValues.join(', ')}`}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-mono truncate max-w-[70px] ${
                          isDark 
                            ? 'bg-slate-800 text-slate-400 border-slate-700' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {String(col.sampleValues[0])}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${cfg.bg} ${cfg.color} ${cfg.border}`}
                    >
                      {cfg.icon}
                      <span>{col.rawType}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Body: Live Data Peek Tab */}
      {activeTab === 'preview' && (
        <div className="p-3 pointer-events-auto">
          {table.rows.length === 0 ? (
            <div className="py-6 text-center">
              <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nenhum registro inserido.</p>
              <p className="text-[11px] text-indigo-500 font-mono">
                Digite: INSERT INTO {table.name} (...) VALUES (...);
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`flex items-center justify-between text-[11px] border-b pb-1.5 ${
                isDark ? 'text-slate-400 border-slate-700/60' : 'text-slate-500 border-slate-200'
              }`}>
                <span>Registros ({table.rows.length})</span>
                <span className="text-emerald-500 font-mono text-[10px]">● Dados Reativos</span>
              </div>
              <div className="space-y-1.5">
                {table.rows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className={`p-2 rounded-lg border text-xs font-mono space-y-0.5 ${
                      isDark 
                        ? 'bg-slate-900/70 border-slate-800' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {Object.entries(row).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{k}:</span>
                        <span className={`font-semibold truncate max-w-[150px] ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          {v === null ? <em className="text-slate-400">null</em> : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Health / Nullability Indicator Bar */}
      <div style={{ height: CARD_FOOTER_HEIGHT }} className={`px-4 border-t flex items-center justify-between text-[10px] pointer-events-none ${
        isDark ? 'bg-slate-900/60 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Schema Válido
        </span>
        <span className={`font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {table.columns.filter((c) => c.isPrimaryKey).length} PK •{' '}
          {table.columns.filter((c) => c.isForeignKey).length} FK
        </span>
      </div>
    </div>
  );
};
