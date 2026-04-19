export type QueryFilter = {
  column: string;
  operator: string;
  value: number | number[] | string;
};

export const YEAR_BOUNDS = { min: 1900, max: 2100 } as const;

export type DatasetRef = { path: string; alias: string };

export type JoinClause = { left: string; right: string; on: string[] };

export type Aggregation = { alias: string; expression: string };

/**
 * Canonical shape for every POST body sent to the WEPPcloud Query Engine.
 * All API helpers should build this type (or a subset) instead of ad-hoc
 * `Record<string, unknown>` objects.
 */
export type QueryPayload = {
  datasets: DatasetRef[];
  columns: string[];
  filters?: QueryFilter[];
  joins?: JoinClause[];
  aggregations?: Aggregation[];
  group_by?: string[];
  order_by?: string[];
  limit?: number;
  scenario?: string;
  include_schema?: boolean;
  include_sql?: boolean;
};
