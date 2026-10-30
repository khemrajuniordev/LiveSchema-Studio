import type { SqlTab } from '../types/schema';

// Workspace shown on the first visit
export const DEFAULT_TABS: SqlTab[] = [
  {
    id: 'tab-schema',
    title: '1_schema.sql',
    content: `-- ========================================================
-- Banco de Dados II · Atividade: Triggers no MySQL
-- Parte 1: DDL – Criação do Banco e das Tabelas
-- ========================================================

CREATE TABLE categoria (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL
);

CREATE TABLE jogo (
  id_jogo INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  id_categoria INT NOT NULL REFERENCES categoria(id_categoria),
  plataforma VARCHAR(30) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  estoque INT NOT NULL DEFAULT 0,
  data_cadastro DATETIME,
  data_atualizacao DATETIME
);

CREATE TABLE cliente (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  data_cadastro DATETIME
);

CREATE TABLE venda (
  id_venda INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL REFERENCES cliente(id_cliente),
  data_venda DATETIME NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE item_venda (
  id_item INT AUTO_INCREMENT PRIMARY KEY,
  id_venda INT NOT NULL REFERENCES venda(id_venda),
  id_jogo INT NOT NULL REFERENCES jogo(id_jogo),
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10, 2)
);

CREATE TABLE historico_preco (
  id_historico INT AUTO_INCREMENT PRIMARY KEY,
  id_jogo INT NOT NULL REFERENCES jogo(id_jogo),
  preco_antigo DECIMAL(10, 2) NOT NULL,
  preco_novo DECIMAL(10, 2) NOT NULL,
  data_alteracao DATETIME NOT NULL
);

CREATE TABLE jogo_removido (
  id_jogo INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  estoque INT NOT NULL,
  data_remocao DATETIME NOT NULL
);
`,
  },
  {
    id: 'tab-dados',
    title: '2_dados_iniciais.sql',
    content: `-- ========================================================
-- Parte 2: DML – Inserção dos Dados Iniciais
-- ========================================================

-- Categorias
INSERT INTO categoria (nome) VALUES 
  ('Ação'),
  ('Esporte'),
  ('RPG');

-- Jogos
INSERT INTO jogo (titulo, id_categoria, plataforma, preco, estoque) VALUES 
  ('Cidade Neon', 1, 'PC', 199.90, 10),
  ('Futebol Total 26', 2, 'PS5', 299.90, 25),
  ('Lendas de Aruanda', 3, 'Switch', 149.90, 8),
  ('Corrida Extrema', 2, 'Xbox', 89.90, 3),
  ('Reino Perdido', 3, 'PC', 249.90, 6);

-- Clientes
INSERT INTO cliente (nome, email) VALUES 
  ('Ana Souza', 'ANA.SOUZA@EMAIL.COM'),
  ('Bruno Lima', 'bruno.lima@email.com'),
  ('Carla Dias', 'Carla.Dias@Email.com'),
  ('Davi Rocha', 'davi.rocha@email.com');

-- Vendas de Apoio
INSERT INTO venda (id_cliente, data_venda, valor_total) VALUES 
  (1, '2026-10-29 14:00:00', 549.70);

INSERT INTO item_venda (id_venda, id_jogo, quantidade, preco_unitario) VALUES 
  (1, 1, 2, 199.90),
  (1, 3, 1, 149.90);
`,
  },
  {
    id: 'tab-queries',
    title: '3_consultas.sql',
    content: `-- ========================================================
-- Parte 5: Validar os Triggers com Consultas
-- ========================================================

-- Teste 3: Conferir se data_cadastro foi preenchida nos jogos
SELECT * FROM jogo;

-- Teste 4: Conferir como ficaram os e-mails dos clientes
SELECT * FROM cliente;

-- Teste 7: Venda completa com joins de itens e jogos
SELECT 
  v.id_venda, 
  c.nome AS cliente, 
  v.valor_total, 
  j.titulo AS jogo, 
  iv.quantidade, 
  iv.preco_unitario
FROM venda v
JOIN cliente c ON v.id_cliente = c.id_cliente
JOIN item_venda iv ON v.id_venda = iv.id_venda
JOIN jogo j ON iv.id_jogo = j.id_jogo;
`,
  },
];
