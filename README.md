# LiveSchema Studio

**Visualizador Reativo de Banco de Dados** — escreva SQL de um lado e veja o diagrama entidade-relacionamento se montar do outro, em tempo real, a cada tecla.

Feito para ajudar estudantes de SQL a entender como funciona a criação de tabelas, as chaves primárias e estrangeiras e a inserção de dados nas colunas.

## Funcionalidades

- **Editor SQL com várias abas** (Monaco, o mesmo editor do VS Code), com realce de sintaxe e autocomplete de palavras-chave, tipos, funções e tabelas já criadas.
- **Diagrama ao vivo**: cada `CREATE TABLE` vira um card no canvas, com colunas, tipos e marcadores de `PK`, `FK`, `UNIQUE` e `NOT NULL`.
- **Relacionamentos automáticos**: `REFERENCES` na coluna ou `FOREIGN KEY ... REFERENCES` na tabela geram as linhas entre as tabelas.
- **Prévia dos dados**: os `INSERT INTO ... VALUES` aparecem como linhas na aba de dados de cada tabela.
- **Canvas interativo**: zoom, arrastar o canvas (segurando espaço) e arrastar as tabelas; botão de auto-layout que organiza tudo sem sobreposição.
- **Modelos prontos**: GameStation (atividade de triggers), E-commerce & Pagamentos e SaaS Multi-tenant.
- **Layouts** dividido, só editor ou só canvas, e **tema claro/escuro**.
- **Salvamento automático** no navegador e **link compartilhável** com o schema embutido na URL.

## Tecnologias

React 19 · TypeScript · Vite · Tailwind CSS 4 · Monaco Editor · Framer Motion · Lucide Icons · Oxlint

## Como rodar

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (normalmente `http://localhost:5173`).

### Outros scripts

| Comando           | O que faz                                   |
| ----------------- | ------------------------------------------- |
| `npm run build`   | Checa os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | Serve localmente a versão gerada pelo build |
| `npm run lint`    | Roda o Oxlint                               |

## Estrutura

```
src/
├── App.tsx                     # Estado global, abas, persistência e compartilhamento
├── engine/sqlParser.ts         # Parser de CREATE TABLE / INSERT e auto-layout
├── types/schema.ts             # Tipos Table, Column, Relationship, SqlTab
└── components/
    ├── SqlEditor.tsx           # Editor Monaco multi-abas e modelos prontos
    ├── InteractiveCanvas.tsx   # Zoom, pan e arraste das tabelas
    ├── FloatingTableCard.tsx   # Card de cada tabela (estrutura e dados)
    ├── RelationshipLines.tsx   # Linhas das chaves estrangeiras em SVG
    ├── CanvasToolbar.tsx       # Controles do canvas
    └── Header.tsx              # Cabeçalho, contadores, layout e tema
```

## SQL suportado

O parser roda direto no navegador e cobre o essencial para estudo:

- `CREATE TABLE [IF NOT EXISTS]` com colunas, tipos e modificadores
- `PRIMARY KEY` na coluna ou na tabela (inclusive composta), `AUTO_INCREMENT` e `SERIAL`
- `REFERENCES tabela(coluna)` na coluna e `[CONSTRAINT nome] FOREIGN KEY (...) REFERENCES ...`
- `INSERT INTO tabela (colunas) VALUES (...), (...)`, incluindo funções como `NOW()` e `CONCAT(...)`

Outros comandos (`SELECT`, `UPDATE`, triggers etc.) podem ficar no editor, mas não alteram o diagrama.
