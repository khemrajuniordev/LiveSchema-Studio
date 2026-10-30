import React from 'react';
import { clearWorkspace } from '../lib/storage';

interface ErrorBoundaryState {
  error: Error | null;
}

// Last line of defense: a render crash would otherwise leave a blank page, and since the
// workspace is persisted the same crash would come back on every reload.
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('LiveSchema Studio crashed:', error, info.componentStack);
  }

  private handleReset = () => {
    if (!window.confirm('Isso apaga as abas e posições salvas neste navegador. Continuar?')) return;
    clearWorkspace();
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-md w-full rounded-2xl glass-card-dark p-6 space-y-4">
          <h1 className="text-base font-semibold">Algo deu errado</h1>
          <p className="text-sm text-slate-400">
            O LiveSchema Studio encontrou um erro inesperado. Recarregar costuma resolver; se o erro
            voltar, restaure o workspace para começar do zero.
          </p>
          <pre className="text-[11px] font-mono text-rose-300 bg-slate-900/80 border border-slate-800 rounded-lg p-3 overflow-auto max-h-32 select-text">
            {this.state.error.message}
          </pre>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3 py-1.5 text-xs rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
            >
              Restaurar workspace
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
