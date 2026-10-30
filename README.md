# LiveSchema Studio

**Visualizador Reativo de Banco de Dados** — escreva SQL de um lado e veja o diagrama entidade-relacionamento se montar do outro, em tempo real, a cada tecla.

Feito para ajudar estudantes de SQL a entender como funciona a criação de tabelas, as chaves primárias e estrangeiras e a inserção de dados nas colunas.

## Funcionalidades

- **Editor SQL com várias abas** (Monaco, o mesmo editor do VS Code), com realce de sintaxe e autocomplete de palavras-chave, tipos, funções e snippets (CREATE TABLE, INSERT, JOIN…).
- **Diagrama ao vivo**: cada `CREATE TABLE` vira um card no canvas, com colunas, tipos e marcadores de `PK`, `FK`, `UNIQUE` e `NOT NULL`.
- **Relacionamentos automáticos**: `REFERENCES` na coluna ou `FOREIGN KEY ... REFERENCES` na tabela geram as linhas entre as tabelas.
- **Prévia dos dados**: os `INSERT INTO ... VALUES` aparecem como linhas na aba de dados de cada tabela.
- **Canvas interativo**: zoom, arrastar o canvas (segurando espaço) e arrastar as tabelas; botão de auto-layout que organiza tudo sem sobreposição.
- **Modelos prontos**: GameStation (atividade de triggers), E-commerce & Pagamentos e SaaS Multi-tenant.
- **Avisos do SQL**: FK para tabela ou coluna que não existe, INSERT com número errado de valores, tabela duplicada e parênteses abertos aparecem no rodapé do editor.
- **Layouts** dividido, só editor ou só canvas, e **tema claro/escuro**.
- **Workspace individual**: cada pessoa começa com uma aba em branco, e o trabalho fica só no navegador dela (sem login, nada vai para servidor). O botão **Limpar tudo** recomeça do zero.
- **Salvamento automático** no navegador e **link compartilhável** com o schema comprimido na própria URL. Nada é enviado para servidor: abrir um link adiciona uma aba, sem apagar o seu trabalho.
- **Exportar .sql**: junta as abas num único script, na ordem que você escolher, com prévia antes de baixar. Adiciona o `;` que faltar no fim de uma aba, avisa sobre `DELIMITER` não restaurado e pode incluir `CREATE DATABASE` + `USE` (MySQL).
- **Imprimir / salvar PDF** só do diagrama.

## Tecnologias

React 19 · TypeScript · Vite · Tailwind CSS 4 · Monaco Editor · Lucide Icons · Oxlint

## Como rodar

Requer Node.js 20.19 ou superior.

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
├── engine/
│   ├── sqlParser.ts            # Parser de CREATE TABLE / INSERT e avisos
│   └── layout.ts               # Medidas dos cards, âncoras das linhas e auto-layout
├── data/                       # Abas iniciais e modelos de exemplo
├── lib/
│   ├── shareLink.ts            # Codifica/decodifica o schema na URL
│   ├── sqlExport.ts            # Junta as abas em um arquivo .sql
│   └── storage.ts              # Chaves do localStorage
├── types/schema.ts             # Tipos Table, Column, Relationship, SqlTab
└── components/
    ├── SqlEditor.tsx           # Abas, modelos, avisos e atalhos de inserção
    ├── ExportDialog.tsx        # Janela de exportação .sql
    ├── editor/                 # Monaco (empacotado, carregado sob demanda) e tema SQL
    ├── InteractiveCanvas.tsx   # Zoom, pan e arraste das tabelas
    ├── FloatingTableCard.tsx   # Card de cada tabela (estrutura e dados)
    ├── RelationshipLines.tsx   # Linhas das chaves estrangeiras em SVG
    ├── CanvasToolbar.tsx       # Controles do canvas
    ├── Header.tsx              # Cabeçalho, contadores, layout e tema
    └── ErrorBoundary.tsx       # Tela de erro com opção de restaurar o workspace
```

## SQL suportado

O parser roda direto no navegador e cobre o essencial para estudo:

- `CREATE [TEMPORARY] TABLE [IF NOT EXISTS] [schema.]tabela` com colunas, tipos (`DECIMAL(10, 2)`, `DOUBLE PRECISION`, `INT UNSIGNED`…) e modificadores `NOT NULL`, `UNIQUE`, `DEFAULT`
- `PRIMARY KEY` na coluna ou na tabela (inclusive composta)
- `UNIQUE (coluna)` no nível da tabela
- `REFERENCES tabela[(coluna)]` na coluna e `[CONSTRAINT nome] FOREIGN KEY (...) REFERENCES ...`; sem a coluna, aponta para a PK da tabela pai
- `INSERT INTO tabela [(colunas)] VALUES (...), (...)`, incluindo funções como `NOW()` e `CONCAT(...)`
- Comentários `--`, `#` e `/* */`

Outros comandos (`SELECT`, `UPDATE`, triggers etc.) podem ficar no editor, mas não alteram o diagrama.

## Deploy na Vercel

O app é 100% estático (não tem backend nem login), então basta a Vercel:

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `khemrajuniordev/LiveSchema-Studio`.
2. A Vercel detecta o Vite sozinha; build `npm run build`, saída `dist`. Não há variáveis de ambiente.
3. Clique em **Deploy**. A cada push no `main` sai um deploy novo, e cada PR ganha uma URL de preview.

O [`vercel.json`](vercel.json) define headers de segurança (CSP, HSTS, `X-Frame-Options`…) e cache permanente para `/assets`. O `npm run preview` serve os mesmos headers, para testar localmente antes de publicar.

