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
  rows: Record<string, unknown>[];
  /** Triggers declared ON this table */
  triggers: Trigger[];
  position: { x: number; y: number };
  colorTag?: string;
}

export interface Trigger {
  name: string;
  /** BEFORE, AFTER or INSTEAD OF */
  timing: string;
  /** INSERT, UPDATE, DELETE, TRUNCATE (PostgreSQL allows several: INSERT OR UPDATE) */
  events: string[];
  /** Other tables the trigger body writes to (INSERT INTO / UPDATE / DELETE FROM) */
  writesTo: string[];
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
  /** Problems found while parsing, in Portuguese, ready to show to the user */
  errors: string[];
}

export interface SqlTab {
  id: string;
  title: string;
  content: string;
}


