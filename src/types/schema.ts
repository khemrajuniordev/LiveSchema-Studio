export type ColumnCategory = 
  | 'key' 
  | 'numeric' 
  | 'text' 
  | 'datetime' 
  | 'boolean' 
  | 'json' 
  | 'other';

export interface Column {
  id: string;
  name: string;
  rawType: string;
  category: ColumnCategory;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  fkTarget?: {
    table: string;
    column: string;
  };
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  sampleValues?: (string | number | boolean | null)[];
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
  rows: Record<string, any>[];
  position: { x: number; y: number };
  colorTag?: string;
}

export interface Relationship {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  cardinality: '1:1' | '1:N' | 'N:N';
}

export interface SchemaParseResult {
  tables: Table[];
  relationships: Relationship[];
  errors: string[];
  totalStatements: number;
}

export interface SqlTab {
  id: string;
  title: string;
  content: string;
}


