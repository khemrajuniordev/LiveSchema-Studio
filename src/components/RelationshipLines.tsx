import React, { useState } from 'react';
import type { Relationship, Table } from '../types/schema';
import { ArrowRight } from 'lucide-react';
import { CARD_WIDTH as cardWidth, columnAnchorY } from '../engine/layout';

interface RelationshipLinesProps {
  relationships: Relationship[];
  tables: Table[];
  theme?: 'dark' | 'light';
  selectedRelId: string | null;
  onSelectRel: (id: string | null) => void;
}

export const RelationshipLines: React.FC<RelationshipLinesProps> = ({
  relationships,
  tables,
  theme = 'dark',
  selectedRelId,
  onSelectRel,
}) => {
  const isDark = theme === 'dark';
  const [hoveredRelId, setHoveredRelId] = useState<string | null>(null);

  const tableMap = new Map<string, Table>();
  tables.forEach((t) => tableMap.set(t.name.toLowerCase(), t));

  // Active rel = selected or hovered
  const activeRelId = selectedRelId ?? hoveredRelId;

  // Sort so active rel renders last (on top in SVG z-order)
  const sorted = [...relationships].sort((a, b) => {
    if (a.id === activeRelId) return 1;
    if (b.id === activeRelId) return -1;
    return 0;
  });

  // SVG rises to z-30 when any rel is active, stays at z-[5] (below table cards z-10) otherwise
  const svgZClass = activeRelId ? 'z-30' : 'z-[5]';

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-visible ${svgZClass}`}
      onClick={(e) => {
        // Click on SVG background (not on a path) → deselect
        if ((e.target as SVGElement).tagName === 'svg') {
          onSelectRel(null);
        }
      }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="fk-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#6366f1" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="fk-gradient-hover" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="1" />
          <stop offset="100%" stopColor="#9333ea" stopOpacity="1" />
        </linearGradient>

        {/* Light-mode gradient */}
        <linearGradient id="fk-gradient-light" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0891b2" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#4f46e5" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="fk-gradient-light-hover" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0369a1" stopOpacity="1" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="1" />
        </linearGradient>

        {/* Glow Filters */}
        <filter id="fk-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Sharp Arrowhead */}
        <marker
          id="fk-arrow"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 1 2 L 11 6 L 1 10 L 4 6 Z" fill="#a855f7" />
        </marker>

        <marker
          id="fk-arrow-hover"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="9"
          markerHeight="9"
          orient="auto"
        >
          <path d="M 1 2 L 11 6 L 1 10 L 4 6 Z" fill="#9333ea" />
        </marker>

        <marker
          id="fk-arrow-light"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 1 2 L 11 6 L 1 10 L 4 6 Z" fill="#7c3aed" />
        </marker>

        <marker
          id="fk-arrow-light-hover"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="9"
          markerHeight="9"
          orient="auto"
        >
          <path d="M 1 2 L 11 6 L 1 10 L 4 6 Z" fill="#6d28d9" />
        </marker>
      </defs>

      {sorted.map((rel) => {
        const sourceTable = tableMap.get(rel.sourceTable.toLowerCase());
        const targetTable = tableMap.get(rel.targetTable.toLowerCase());

        if (!sourceTable || !targetTable) return null;

        const isSelected = selectedRelId === rel.id;
        const isHovered = hoveredRelId === rel.id;
        const isActive = isSelected || isHovered;

        // Dim non-active lines when there is an active selection
        const isDimmed = !!activeRelId && !isActive;

        // Calculate Y offsets based on column index
        const sourceColIdx = Math.max(
          0,
          sourceTable.columns.findIndex((c) => c.name.toLowerCase() === rel.sourceColumn.toLowerCase())
        );
        const targetColIdx = Math.max(
          0,
          targetTable.columns.findIndex((c) => c.name.toLowerCase() === rel.targetColumn.toLowerCase())
        );

        const sourceY = sourceTable.position.y + columnAnchorY(sourceColIdx);
        const targetY = targetTable.position.y + columnAnchorY(targetColIdx);

        // Determine left or right anchor
        const isTargetToTheRight = targetTable.position.x > sourceTable.position.x;

        const startX = isTargetToTheRight
          ? sourceTable.position.x + cardWidth
          : sourceTable.position.x;
        const startY = sourceY;

        const endX = isTargetToTheRight
          ? targetTable.position.x
          : targetTable.position.x + cardWidth;
        const endY = targetY;

        // Cubic bezier control points
        const dx = Math.max(60, Math.abs(endX - startX) * 0.5);
        const cp1X = isTargetToTheRight ? startX + dx : startX - dx;
        const cp1Y = startY;
        const cp2X = isTargetToTheRight ? endX - dx : endX + dx;
        const cp2Y = endY;

        const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

        // Midpoint for badge
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        // Pick gradient/arrow IDs
        const gradientId = isDark
          ? isActive ? 'url(#fk-gradient-hover)' : 'url(#fk-gradient)'
          : isActive ? 'url(#fk-gradient-light-hover)' : 'url(#fk-gradient-light)';
        const arrowId = isDark
          ? isActive ? 'url(#fk-arrow-hover)' : 'url(#fk-arrow)'
          : isActive ? 'url(#fk-arrow-light-hover)' : 'url(#fk-arrow-light)';

        return (
          <g
            key={rel.id}
            onMouseEnter={() => setHoveredRelId(rel.id)}
            onMouseLeave={() => setHoveredRelId(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectRel(isSelected ? null : rel.id);
            }}
            className="transition-all duration-300"
            style={{ opacity: isDimmed ? 0.22 : 1 }}
          >
            {/* 1. Invisible wide hover hit-area */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="22"
              className="pointer-events-auto cursor-pointer"
            />

            {/* 2. Backdrop track */}
            <path
              d={pathData}
              fill="none"
              stroke={isDark ? '#090d16' : '#cbd5e1'}
              strokeWidth={isActive ? '8' : isDimmed ? '4' : '6'}
              strokeOpacity={isDark ? '0.9' : '0.7'}
            />

            {/* 3. Solid base relationship line */}
            <path
              d={pathData}
              fill="none"
              stroke={gradientId}
              strokeWidth={isActive ? '3.5' : isDimmed ? '1.5' : '2'}
              markerEnd={arrowId}
              filter={isActive ? 'url(#fk-glow)' : undefined}
              className="transition-all duration-200"
            />

            {/* 4. Directional moving laser dashes — only visible when active */}
            {isActive && (
              <path
                d={pathData}
                fill="none"
                stroke={isDark ? '#ffffff' : '#4338ca'}
                strokeWidth={isHovered ? '2' : '1.5'}
                strokeOpacity={isDark ? '0.9' : '0.85'}
                strokeDasharray="6 12"
                className="animate-flow-fk pointer-events-none"
              />
            )}

            {/* 5. Source Anchor Pin (FK) */}
            <circle
              cx={startX}
              cy={startY}
              r={isActive ? '5' : '3.5'}
              fill={isDark ? '#06b6d4' : '#0891b2'}
              opacity={isDimmed ? 0.4 : 1}
              className="transition-all duration-200"
            />

            {/* 6. Target Anchor Pin (PK) */}
            <circle
              cx={endX}
              cy={endY}
              r={isActive ? '5' : '3.5'}
              fill={isDark ? '#a855f7' : '#7c3aed'}
              opacity={isDimmed ? 0.4 : 1}
              className="transition-all duration-200"
            />

            {/* 7. Badge — visible on hover or selection */}
            <foreignObject
              x={midX - 100}
              y={midY - 14}
              width="200"
              height="28"
              className={`overflow-visible ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.2s ease' }}
            >
              <div
                title={`Chave Estrangeira: ${rel.sourceTable}.${rel.sourceColumn} ➔ ${rel.targetTable}.${rel.targetColumn}`}
                className={`mx-auto w-fit px-2.5 py-1 rounded-full text-[10px] font-mono flex items-center gap-1.5 shadow-xl transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-slate-900 border-2 border-cyan-400 text-cyan-200 scale-110 shadow-cyan-500/30 ring-2 ring-cyan-500/30'
                      : 'bg-white border-2 border-indigo-500 text-indigo-700 scale-110 shadow-indigo-500/30 ring-2 ring-indigo-500/20'
                    : isDark
                      ? 'bg-slate-900 border border-cyan-400 text-cyan-200 scale-105 shadow-cyan-500/20'
                      : 'bg-white border border-indigo-400 text-indigo-700 scale-105 shadow-indigo-400/20'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
                  }`}>FK</span>
                  <span className={`font-medium truncate max-w-[55px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {rel.sourceColumn}
                  </span>
                </div>

                <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />

                <div className="flex items-center gap-1">
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800'
                  }`}>PK</span>
                  <span className={`font-medium truncate max-w-[90px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {rel.targetTable}.{rel.targetColumn}
                  </span>
                </div>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
};
