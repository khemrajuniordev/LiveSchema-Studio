import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  LayoutGrid, 
  Download, 
  Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CanvasToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onAutoLayout: () => void;
  onExport: () => void;
  theme?: 'dark' | 'light';
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onAutoLayout,
  onExport,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#22d3ee', '#10b981', '#f59e0b'],
    });
  };

  return (
    <div className={`absolute bottom-5 right-5 z-40 flex items-center gap-1.5 p-1.5 rounded-xl shadow-2xl transition-colors ${
      isDark ? 'glass-panel-dark text-slate-200' : 'glass-panel-light text-slate-800'
    }`}>
      {/* Zoom controls */}
      <button
        type="button"
        onClick={onZoomOut}
        title="Diminuir Zoom (Ctrl + Scroll Baixo)"
        className={`p-2 rounded-lg transition-colors ${
          isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onResetZoom}
        title="Redefinir Zoom para 100% (Ctrl + 0)"
        className={`px-2 py-1 text-xs font-mono rounded-lg transition-colors ${
          isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        type="button"
        onClick={onZoomIn}
        title="Aumentar Zoom (Ctrl + Scroll Cima)"
        className={`p-2 rounded-lg transition-colors ${
          isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className={`w-px h-5 mx-1 ${isDark ? 'bg-slate-700/60' : 'bg-slate-300'}`} />

      {/* Auto layout */}
      <button
        type="button"
        onClick={onAutoLayout}
        title="Auto-organizar Posições sem sobreposição"
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors font-medium border ${
          isDark 
            ? 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30' 
            : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Organizar</span>
      </button>

      {/* Confetti celebration */}
      <button
        type="button"
        onClick={triggerConfetti}
        title="Comemorar Schema!"
        className={`p-2 rounded-lg transition-colors ${
          isDark ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-700/60' : 'text-amber-600 hover:text-amber-700 hover:bg-slate-100'
        }`}
      >
        <Sparkles className="w-4 h-4" />
      </button>

      {/* Export */}
      <button
        type="button"
        onClick={onExport}
        title="Exportar Imagem"
        className={`p-2 rounded-lg transition-colors ${
          isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};
