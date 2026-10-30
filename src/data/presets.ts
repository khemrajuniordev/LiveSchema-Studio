// Example schemas offered in the editor's "Exemplos" bar
export const PRESETS: Record<string, { label: string; sql: string }> = {
  gamestation: {
    label: '🎮 GameStation (Atividade Triggers)',
    sql: `-- ========================================================
-- Banco de Dados II · Atividade: Triggers no MySQL
-- Cenário: Loja de Games GameStation
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

INSERT INTO categoria (nome) VALUES 
  ('Ação'),
  ('Esporte'),
  ('RPG');

INSERT INTO jogo (titulo, id_categoria, plataforma, preco, estoque) VALUES 
  ('Cidade Neon', 1, 'PC', 199.90, 10),
  ('Futebol Total 26', 2, 'PS5', 299.90, 25),
  ('Lendas de Aruanda', 3, 'Switch', 149.90, 8),
  ('Corrida Extrema', 2, 'Xbox', 89.90, 3),
  ('Reino Perdido', 3, 'PC', 249.90, 6);

INSERT INTO cliente (nome, email) VALUES 
  ('Ana Souza', 'ANA.SOUZA@EMAIL.COM'),
  ('Bruno Lima', 'bruno.lima@email.com'),
  ('Carla Dias', 'Carla.Dias@Email.com'),
  ('Davi Rocha', 'davi.rocha@email.com');
`,
  },
  ecommerce: {
    label: '🛍️ E-commerce & Pagamentos',
    sql: `-- 🛒 Schema de E-commerce Vivo
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(50) NOT NULL,
  slug VARCHAR(60) UNIQUE
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id),
  title VARCHAR(120) NOT NULL,
  price NUMERIC(10, 2),
  is_active BOOLEAN
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  total_amount NUMERIC(10, 2),
  status VARCHAR(30)
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  product_id INT REFERENCES products(id),
  quantity INT,
  unit_price NUMERIC(10, 2)
);

INSERT INTO users (name, email) VALUES 
  ('Lucas Rossi', 'lucas@exemplo.com'),
  ('Mariana Costa', 'mariana@exemplo.com');
`,
  },
  saas: {
    label: '🏢 SaaS Multi-tenant',
    sql: `-- 🏢 SaaS B2B Multi-inquilino
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  plan VARCHAR(40),
  created_at TIMESTAMP
);

CREATE TABLE members (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  full_name VARCHAR(100),
  role VARCHAR(30)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(80),
  is_archived BOOLEAN
);
`,
  },
};
