import React from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import './monacoSetup';

// ---------------------------------------------------------------------------
// Inner Monaco wrapper — isolated so key-based remount stays cheap
// ---------------------------------------------------------------------------
interface MonacoSqlEditorProps {
  value: string;
  onChange: (v: string) => void;
  theme: string;
  isDark: boolean;
  onMount: (ed: editor.IStandaloneCodeEditor) => void;
}

const MonacoSqlEditor: React.FC<MonacoSqlEditorProps> = ({ value, onChange, theme, isDark, onMount }) => {
  return (
    <Editor
      height="100%"
      language="sql"
      value={value}
      theme={theme}
      onChange={(v) => onChange(v ?? '')}
      onMount={onMount}
      options={{
        fontSize: 13,
        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", "Menlo", monospace',
        fontLigatures: true,
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: false,
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        acceptSuggestionOnCommitCharacter: true,
        acceptSuggestionOnEnter: 'smart',
        snippetSuggestions: 'top',
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showFunctions: true,
          filterGraceful: true,
          localityBonus: true,
        },
        bracketPairColorization: { enabled: true },
        renderWhitespace: 'none',
        smoothScrolling: true,
        cursorSmoothCaretAnimation: 'on',
        cursorBlinking: 'smooth',
        renderLineHighlight: 'line',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        padding: { top: 12, bottom: 12 },
        contextmenu: true,
        mouseWheelZoom: false,
        colorDecorators: true,
        'semanticHighlighting.enabled': true,
      } as editor.IStandaloneEditorConstructionOptions}
      loading={
        <div className={`w-full h-full flex items-center justify-center text-xs ${isDark ? 'text-slate-500 bg-slate-950' : 'text-slate-400 bg-white'}`}>
          Carregando editor SQL…
        </div>
      }
    />
  );
};

export default MonacoSqlEditor;
