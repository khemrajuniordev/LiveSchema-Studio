import type { SqlTab } from '../types/schema';

// Workspace of a first visit (and after "Limpar tudo"): one blank tab with a short hint.
// Each visitor's work lives only in their own browser (localStorage).
export const STARTER_SQL = `-- Bem-vindo ao LiveSchema Studio!
-- Escreva seu SQL aqui: cada CREATE TABLE vira um card no diagrama ao lado.
-- Para começar rápido, use "Exemplos" acima ou "+ Tabela" abaixo.

`;

export function createDefaultTabs(): SqlTab[] {
  return [{ id: `tab-${Date.now()}`, title: 'schema.sql', content: STARTER_SQL }];
}
