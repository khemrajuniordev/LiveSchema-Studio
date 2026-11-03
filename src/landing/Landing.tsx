import { ArrowRight, Database, GitFork, Share2, Zap } from 'lucide-react';
import { EDITOR_PATH } from '../routes';

// Temporary landing page — to be replaced by the design from Figma (land-liveschema)
const FEATURES = [
  { icon: Database, title: 'Diagrama ao vivo', text: 'Cada CREATE TABLE vira um card com colunas, tipos, PK e FK enquanto você digita.' },
  { icon: GitFork, title: 'Relacionamentos', text: 'As chaves estrangeiras aparecem como linhas ligando as tabelas.' },
  { icon: Zap, title: 'Dados e triggers', text: 'Os INSERTs aparecem dentro das tabelas, e os triggers no card da tabela em que disparam.' },
  { icon: Share2, title: 'Compartilhe e exporte', text: 'Mande o schema por link ou baixe tudo num único arquivo .sql.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" width={32} height={32} />
          <span className="font-bold text-sm tracking-tight">
            LiveSchema <span className="text-indigo-600">Studio</span>
          </span>
        </div>
        <a
          href={EDITOR_PATH}
          className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Abrir o editor
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <section className="py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
            Escreva SQL e veja o banco de dados se montar em tempo real
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Um visualizador para quem está aprendendo SQL: tabelas, chaves e relacionamentos aparecem no diagrama a cada tecla.
            Gratuito, sem cadastro, e o seu trabalho fica só no seu navegador.
          </p>
          <a
            href={EDITOR_PATH}
            className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/25 transition-colors"
          >
            Começar agora
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>

        <section className="pb-20 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-sm">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <a href="https://github.com/khemrajuniordev/LiveSchema-Studio" className="hover:text-slate-800">
          Código no GitHub
        </a>
      </footer>
    </div>
  );
}
