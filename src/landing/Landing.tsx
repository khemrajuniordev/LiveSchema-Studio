// Landing page from Figma (land-liveschema, code layer "LiveSchema Studio")
import { useEffect, useState } from 'react'
import { EDITOR_PATH } from '../routes'
import { ArrowRight, Check, Database, Sparkles, Diagram, Key, Download, Cloud, Menu, X, Chevron, Github, LinkedIn } from './icons'
import './landing.css'

const CURRENT_YEAR = new Date().getFullYear()

const navItems = [
  ['Recursos', '#recursos'],
  ['IA', '#ia'],
  ['FAQ', '#faq'],
]

const schemaOptions = {
  ecommerce: {
    label: 'E-commerce',
    code: [
      ['kw', 'CREATE TABLE '],
      ['name', 'products '],
      ['plain', '('],
      ['line', '  id '],
      ['type', 'UUID '],
      ['kw', 'PRIMARY KEY'],
      ['plain', ','],
      ['line', '  name '],
      ['type', 'VARCHAR(120) '],
      ['kw', 'NOT NULL'],
      ['plain', ','],
      ['line', '  price '],
      ['type', 'DECIMAL(10,2)'],
      ['plain', ','],
      ['line', '  category_id '],
      ['type', 'UUID'],
      ['line', '  created_at '],
      ['type', 'TIMESTAMP'],
      ['line', '    DEFAULT '],
      ['fn', 'NOW()'],
      ['plain', ');'],
    ],
    table: 'products',
    columns: [
      ['id', 'uuid', 'PK'],
      ['name', 'varchar(120)', ''],
      ['price', 'decimal(10,2)', ''],
      ['category_id', 'uuid', 'FK'],
      ['created_at', 'timestamp', ''],
    ],
  },
  education: {
    label: 'Educação',
    code: [
      ['kw', 'CREATE TABLE '],
      ['name', 'students '],
      ['plain', '('],
      ['line', '  id '],
      ['type', 'SERIAL '],
      ['kw', 'PRIMARY KEY'],
      ['plain', ','],
      ['line', '  full_name '],
      ['type', 'VARCHAR(160)'],
      ['plain', ','],
      ['line', '  email '],
      ['type', 'VARCHAR(255) '],
      ['kw', 'UNIQUE'],
      ['plain', ','],
      ['line', '  class_id '],
      ['type', 'INTEGER'],
      ['line', '  enrolled_at '],
      ['type', 'TIMESTAMP'],
      ['line', '    DEFAULT '],
      ['fn', 'NOW()'],
      ['plain', ');'],
    ],
    table: 'students',
    columns: [
      ['id', 'serial', 'PK'],
      ['full_name', 'varchar(160)', ''],
      ['email', 'varchar(255)', 'UQ'],
      ['class_id', 'integer', 'FK'],
      ['enrolled_at', 'timestamp', ''],
    ],
  },
}

const features = [
  {
    icon: Diagram,
    title: 'Diagramas reativos',
    text: 'Cada linha de SQL transforma-se instantaneamente em uma estrutura visual clara, sem recarregar a página.',
    color: 'indigo',
  },
  {
    icon: Key,
    title: 'Relações PK e FK',
    text: 'Identifique chaves, cardinalidade e dependências entre tabelas antes que elas virem um problema.',
    color: 'violet',
  },
  {
    icon: Sparkles,
    title: 'Assistente com IA',
    text: 'Descreva seu projeto em linguagem natural e receba um schema SQL pronto para evoluir.',
    color: 'fuchsia',
  },
  {
    icon: Download,
    title: 'Exporte sem limites',
    text: 'Leve seus diagramas para documentação ou aulas em PNG, SVG e DDL SQL de alta qualidade.',
    color: 'blue',
  },
]

const faqs = [
  ['Preciso instalar alguma coisa?', 'Não. O LiveSchema Studio funciona direto no navegador e seus diagramas são atualizados enquanto você digita.'],
  ['Quais bancos de dados são suportados?', 'Atualmente interpretamos sintaxes de PostgreSQL, MySQL e SQLite, com novos dialetos sendo adicionados continuamente.'],
  ['A IA pode alterar meu projeto?', 'A IA apenas sugere schemas e melhorias. Você sempre revisa e aprova qualquer alteração antes que ela seja aplicada.'],
]

function Logo() {
  return (
    <a href="#inicio" className="group flex items-center gap-2.5" aria-label="LiveSchema Studio — início">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-300 shadow-[0_0_24px_rgba(99,102,241,0.16)]">
        <Database className="size-5" />
        <span className="absolute inset-x-1 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-white">
        LiveSchema <span className="text-slate-400">Studio</span>
      </span>
    </a>
  )
}

function SchemaMockup() {
  const [activeSchema, setActiveSchema] = useState<keyof typeof schemaOptions>('ecommerce')
  const schema = schemaOptions[activeSchema]

  return (
    <div className="mockup-glow relative mx-auto mt-16 w-full max-w-6xl lg:mt-20">
      <div className="absolute -inset-px rounded-[25px] bg-gradient-to-b from-indigo-400/40 via-violet-500/15 to-transparent" />
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 text-left shadow-2xl shadow-indigo-950/40 backdrop-blur-xl">
        <div className="flex h-12 items-center justify-between border-b border-white/8 bg-white/[0.025] px-4 sm:px-5">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-white/8 bg-slate-900 px-3 py-1 text-[11px] text-slate-500 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            projeto-loja.sql
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            <span className="size-1.5 animate-pulse rounded-full bg-indigo-400" />
            Live
          </span>
        </div>

        <div className="grid min-h-[430px] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-white/8 lg:border-r lg:border-b-0">
            <div className="flex h-11 items-center justify-between border-b border-white/8 px-4">
              <span className="text-xs font-medium text-slate-400">Editor SQL</span>
              <div className="flex gap-1 rounded-lg bg-white/[0.035] p-1">
                {(Object.keys(schemaOptions) as (keyof typeof schemaOptions)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveSchema(key)}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                      activeSchema === key ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {schemaOptions[key].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex font-mono text-[12px] leading-7 sm:text-[13px]">
              <div className="select-none border-r border-white/5 px-3 py-5 text-right text-slate-700 sm:px-4">
                {Array.from({ length: 10 }, (_, index) => (
                  <div key={index}>{index + 1}</div>
                ))}
              </div>
              <pre className="overflow-hidden px-4 py-5 sm:px-5" aria-label={`Código SQL para tabela ${schema.table}`}>
                <code>
                  {schema.code.map(([type, content], index) => (
                    <span
                      key={`${content}-${index}`}
                      className={
                        type === 'kw'
                          ? 'text-fuchsia-400'
                          : type === 'name'
                            ? 'text-cyan-300'
                            : type === 'type'
                              ? 'text-amber-300'
                              : type === 'fn'
                                ? 'text-indigo-300'
                                : 'text-slate-300'
                      }
                    >
                      {type === 'line' ? `\n${content}` : content}
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          </div>

          <div className="relative flex min-h-[350px] items-center justify-center overflow-hidden bg-slate-900/30 p-6 sm:p-10">
            <div className="diagram-grid absolute inset-0 opacity-40" />
            <div className="absolute left-[12%] top-[18%] size-2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.9)]" />
            <div className="absolute bottom-[20%] right-[13%] size-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
            <div className="relative w-full max-w-sm animate-float overflow-hidden rounded-xl border border-indigo-400/25 bg-slate-950/95 shadow-[0_20px_70px_rgba(2,6,23,0.7),0_0_40px_rgba(99,102,241,0.1)]">
              <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-indigo-500/15 to-violet-500/10 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Database className="size-4 text-indigo-300" />
                  {schema.table}
                </span>
                <span className="rounded bg-indigo-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-indigo-300">
                  public
                </span>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {schema.columns.map(([name, type, badge]) => (
                  <div key={name} className="group flex items-center justify-between px-4 py-2.5 transition hover:bg-white/[0.025]">
                    <div className="flex items-center gap-2.5">
                      {badge === 'PK' ? (
                        <Key className="size-3.5 text-amber-300" />
                      ) : (
                        <span className="ml-1 size-1.5 rounded-full bg-slate-700" />
                      )}
                      <span className="font-mono text-[11px] text-slate-300">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-600">{type}</span>
                      {badge && (
                        <span
                          className={`min-w-6 rounded px-1 py-0.5 text-center font-mono text-[8px] font-semibold ${
                            badge === 'PK' ? 'bg-amber-400/10 text-amber-300' : 'bg-violet-400/10 text-violet-300'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex h-8 items-center justify-between border-t border-white/8 bg-white/[0.02] px-4 font-mono text-[9px] text-slate-600">
          <span>Ln 10, Col 3</span>
          <span className="flex items-center gap-3">
            <span>PostgreSQL</span>
            <span className="text-emerald-400">Schema válido</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // The landing renders after its lazy chunk loads, too late for the browser to jump to #faq & co.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
  }, [])

  return (
    <div className="landing min-h-screen overflow-hidden bg-slate-950 text-slate-300 antialiased selection:bg-indigo-500/30 selection:text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="text-sm font-medium text-slate-400 transition hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden md:block">
            <a
              href={EDITOR_PATH}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:border-indigo-400/50 hover:bg-indigo-500/20"
            >
              Abrir App Grátis
              <ArrowRight className="size-4" />
            </a>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg border border-white/10 text-slate-300 md:hidden"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-white/[0.06] bg-slate-950 px-5 py-5 md:hidden" aria-label="Navegação mobile">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  {label}
                </a>
              ))}
              <a
                href={EDITOR_PATH}
                onClick={() => setMenuOpen(false)}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Abrir App Grátis <ArrowRight className="size-4" />
              </a>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section id="inicio" className="relative px-5 pb-24 pt-36 sm:px-8 sm:pt-44 lg:pb-32">
          <div className="hero-orb pointer-events-none absolute left-1/2 top-10 h-[620px] w-[900px] -translate-x-1/2" />
          <div className="noise pointer-events-none absolute inset-0 opacity-[0.025]" />
          <div className="relative mx-auto max-w-7xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/[0.08] px-3.5 py-1.5 text-xs font-medium text-indigo-200 shadow-[inset_0_1px_rgba(255,255,255,0.05)]">
              <span aria-hidden="true">⚡</span>
              Modelagem de Banco de Dados em Tempo Real
            </div>
            <h1 className="mx-auto mt-7 max-w-5xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Do código SQL ao diagrama,{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                na velocidade do seu pensamento.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-slate-400 sm:text-lg">
              Escreva, visualize e entenda bancos de dados sem fricção. Feito para estudantes, professores e devs que
              querem transformar schemas complexos em ideias claras.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={EDITOR_PATH}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.12)] transition hover:bg-indigo-50 sm:w-auto"
              >
                Criar meu primeiro diagrama
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#recursos"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06] sm:w-auto"
              >
                Explorar recursos
              </a>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-400" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-400" /> Pronto em 30 segundos</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-400" /> 100% gratuito</span>
            </div>
            <SchemaMockup />
          </div>
        </section>

        <section id="recursos" className="relative border-y border-white/[0.06] bg-slate-900/20 px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <span className="section-label">Recursos essenciais</span>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                Menos abstração. Mais entendimento.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-400">
                Uma ferramenta visual com tudo o que você precisa para projetar, ensinar e documentar bancos de dados.
              </p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="feature-card group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/25 hover:bg-white/[0.04]"
                >
                  <span className="absolute right-5 top-4 font-mono text-[10px] text-slate-700">0{index + 1}</span>
                  <div className={`icon-box icon-${feature.color}`}>
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="mt-7 text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="ia" className="relative px-5 py-24 sm:px-8 lg:py-32">
          <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] bg-violet-600/[0.07] blur-[140px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="section-label"><Sparkles className="size-3.5" /> IA integrada</span>
              <h2 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                Descreva sua ideia. A IA desenha a estrutura.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
                Transforme requisitos em schemas consistentes, receba sugestões de normalização e entenda cada decisão
                sem perder o controle do seu projeto.
              </p>
              <div className="mt-8 space-y-4">
                {['Geração de SQL em linguagem natural', 'Explicações didáticas para cada relação', 'Sugestões de performance e normalização'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="grid size-6 place-items-center rounded-full border border-violet-400/20 bg-violet-400/10 text-violet-300">
                      <Check className="size-3.5" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-violet-950/30">
                <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-4 text-xs font-medium text-slate-400">
                  <Sparkles className="size-4 text-violet-300" />
                  LiveSchema AI
                  <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-emerald-300">Online</span>
                </div>
                <div className="space-y-5 p-5 sm:p-7">
                  <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm border border-indigo-400/15 bg-indigo-500/10 px-4 py-3 text-sm leading-6 text-slate-300">
                    Crie um schema para uma plataforma de cursos com alunos, aulas e progresso.
                  </div>
                  <div className="max-w-[95%] rounded-2xl rounded-bl-sm border border-white/[0.07] bg-white/[0.035] p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-medium text-violet-300">
                      <Sparkles className="size-3.5" />
                      Schema gerado
                    </div>
                    <div className="space-y-2 font-mono text-[11px] text-slate-400">
                      <p><span className="text-fuchsia-400">CREATE TABLE</span> <span className="text-cyan-300">students</span> (...);</p>
                      <p><span className="text-fuchsia-400">CREATE TABLE</span> <span className="text-cyan-300">lessons</span> (...);</p>
                      <p><span className="text-fuchsia-400">CREATE TABLE</span> <span className="text-cyan-300">progress</span> (...);</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[10px] text-slate-500">
                      <Check className="size-3.5 text-emerald-400" />
                      3 tabelas · 4 relações · normalizado em 3FN
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-white/[0.06] pt-5 text-xs text-slate-600">
                    <span className="h-4 w-0.5 animate-pulse bg-violet-400" />
                    Peça uma alteração no schema...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <span className="section-label">FAQ</span>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Ainda tem dúvidas? Fale com nosso time e responderemos em até um dia útil.
              </p>
              <a href="mailto:ola@liveschema.studio" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200">
                ola@liveschema.studio <ArrowRight className="size-4" />
              </a>
            </div>
            <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {faqs.map(([question, answer], index) => {
                const isOpen = openFaq === index
                return (
                  <div key={question}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-6 py-5 text-left text-sm font-medium text-slate-200 transition hover:text-white"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      {question}
                      <Chevron className={`size-4 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && <p className="max-w-2xl pb-5 pr-10 text-sm leading-6 text-slate-500">{answer}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 lg:pb-32">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-violet-500/[0.08] to-slate-900 px-6 py-14 text-center sm:px-12 sm:py-20">
            <div className="diagram-grid pointer-events-none absolute inset-0 opacity-20" />
            <div className="absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 bg-indigo-400/15 blur-[80px]" />
            <div className="relative">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                Seu próximo schema começa aqui.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-balance text-sm leading-6 text-slate-400 sm:text-base">
                Junte-se a quem está tornando bancos de dados mais visuais, colaborativos e fáceis de entender.
              </p>
              <a href={EDITOR_PATH} className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-50">
                Abrir App Grátis
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <Logo />
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
              <a href="#recursos" className="transition hover:text-white">Recursos</a>
              <a href="#faq" className="transition hover:text-white">Central de ajuda</a>
              <a href="#inicio" className="transition hover:text-white">Privacidade</a>
              <a href="#inicio" className="transition hover:text-white">Termos</a>
            </div>
            <div className="flex items-center gap-2">
              <a href="https://github.com/khemrajuniordev/LiveSchema-Studio" aria-label="GitHub" className="grid size-9 place-items-center rounded-lg border border-white/[0.08] text-slate-500 transition hover:border-white/20 hover:text-white">
                <Github className="size-4" />
              </a>
              <a href="#inicio" aria-label="LinkedIn" className="grid size-9 place-items-center rounded-lg border border-white/[0.08] text-slate-500 transition hover:border-white/20 hover:text-white">
                <LinkedIn className="size-4" />
              </a>
            </div>
          </div>
          <div className="mt-9 flex flex-col justify-between gap-2 border-t border-white/[0.06] pt-6 text-[11px] text-slate-600 sm:flex-row">
            <span>© {CURRENT_YEAR} LiveSchema Studio. Todos os direitos reservados.</span>
            <span className="flex items-center gap-1.5"><Cloud className="size-3.5" /> Feito para quem constrói o futuro.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

