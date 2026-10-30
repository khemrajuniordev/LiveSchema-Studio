import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FloatingTableCard } from './FloatingTableCard';
import { RelationshipLines } from './RelationshipLines';
import { CanvasToolbar } from './CanvasToolbar';
import type { Relationship, Table } from '../types/schema';

interface InteractiveCanvasProps {
  tables: Table[];
  relationships: Relationship[];
  onTablePositionChange: (id: string, x: number, y: number) => void;
  onAutoLayout: () => void;
  theme?: 'dark' | 'light';
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  tables,
  relationships,
  onTablePositionChange,
  onAutoLayout,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);

  // Table drag state (free drag without magnets or snap-backs)
  const [draggingTable, setDraggingTable] = useState<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
  } | null>(null);

  // Smooth zoom towards a focal point
  const zoomAtPoint = useCallback((factor: number, clientX?: number, clientY?: number) => {
    setZoom((prevZoom) => {
      const newZoom = Math.min(2.5, Math.max(0.3, Number((prevZoom * factor).toFixed(2))));
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const targetX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
        const targetY = clientY !== undefined ? clientY - rect.top : rect.height / 2;

        setPan((prevPan) => {
          const newPanX = targetX - (targetX - prevPan.x) * (newZoom / prevZoom);
          const newPanY = targetY - (targetY - prevPan.y) * (newZoom / prevZoom);
          return { x: newPanX, y: newPanY };
        });
      }
      return newZoom;
    });
  }, []);

  // Native non-passive wheel listener: enables Ctrl + Scroll Zoom without browser scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        zoomAtPoint(zoomFactor, e.clientX, e.clientY);
      } else {
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [zoomAtPoint]);

  // Keyboard shortcuts: Space for Pan, Ctrl+ / Ctrl- / Ctrl 0 for Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd') {
          e.preventDefault();
          zoomAtPoint(1.15);
        } else if (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          zoomAtPoint(1 / 1.15);
        } else if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
          e.preventDefault();
          setZoom(1);
          setPan({ x: 80, y: 40 });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [zoomAtPoint]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    panStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }, [pan]);

  const handleStartDragTable = useCallback((e: React.PointerEvent, id: string, initX: number, initY: number) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    setSelectedTableId(id);
    setDraggingTable({
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: initX,
      startY: initY,
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    const isInsideCard = !!target.closest('.glass-card-dark') || !!target.closest('.glass-card-light');
    const isInsideButton = !!target.closest('button');

    if (e.button === 1 || isSpacePressed || (!isInsideCard && !isInsideButton && e.button === 0)) {
      e.preventDefault();
      startPan(e.clientX, e.clientY);
      if (!isInsideCard) {
        setSelectedTableId(null);
        setSelectedRelId(null);
      }
    }
  };

  // Global pointer listeners for smooth dragging and panning
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (draggingTable) {
        const dx = (e.clientX - draggingTable.startMouseX) / zoom;
        const dy = (e.clientY - draggingTable.startMouseY) / zoom;
        onTablePositionChange(
          draggingTable.id,
          Math.round(draggingTable.startX + dx),
          Math.round(draggingTable.startY + dy)
        );
        return;
      }

      if (isPanning) {
        const dx = e.clientX - panStartRef.current.mouseX;
        const dy = e.clientY - panStartRef.current.mouseY;
        setPan({
          x: panStartRef.current.panX + dx,
          y: panStartRef.current.panY + dy,
        });
      }
    };

    const handlePointerUp = () => {
      if (draggingTable) {
        setDraggingTable(null);
      }
      if (isPanning) {
        setIsPanning(false);
      }
    };

    if (isPanning || draggingTable) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingTable, isPanning, zoom, onTablePositionChange]);

  const handleZoomIn = () => zoomAtPoint(1.15);
  const handleZoomOut = () => zoomAtPoint(1 / 1.15);
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 80, y: 40 });
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={`relative w-full h-full overflow-hidden canvas-dot-grid ${
        isDark ? 'theme-dark' : 'theme-light'
      } ${
        isPanning || draggingTable
          ? 'cursor-grabbing'
          : isSpacePressed
          ? 'cursor-grab'
          : 'cursor-default'
      }`}
    >
      {/* Visual Canvas World (Pan & Zoom Container) */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        className="select-none"
      >
        {/* SVG Dynamic Relationships Layer */}
        <RelationshipLines
          relationships={relationships}
          tables={tables}
          theme={theme}
          selectedRelId={selectedRelId}
          onSelectRel={setSelectedRelId}
        />

        {/* Floating Table Cards Layer */}
        {tables.map((table) => (
          <FloatingTableCard
            key={table.id}
            table={table}
            isSelected={selectedTableId === table.id}
            onSelect={() => setSelectedTableId(table.id)}
            onStartDrag={handleStartDragTable}
            theme={theme}
          />
        ))}

        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`p-8 rounded-2xl text-center max-w-sm ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                ✨
              </div>
              <h3 className={`font-semibold text-sm mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Seu Canvas está Vazio
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Digite um comando <code className="text-indigo-500 font-mono">CREATE TABLE</code> no editor ao lado ou selecione um exemplo no topo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Canvas Controls */}
      <CanvasToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onAutoLayout={onAutoLayout}
        onExport={handleExport}
        theme={theme}
      />
    </div>
  );
};
