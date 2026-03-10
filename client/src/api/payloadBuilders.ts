import type {
  QueryPayload,
  QueryFilter,
  DatasetRef,
  JoinClause,
  Aggregation,
} from "./types";

/**
 * Start building a QueryPayload with required fields.
 * Chain optional setters or spread additional fields as needed.
 *
 * @example
 *   const payload = buildPayload(
 *     [{ path: "rap/rap_ts.parquet", alias: "rap" }],
 *     ["rap.year AS year", "rap.value AS value"],
 *   )
 *     .withFilters([{ column: "rap.band", operator: "=", value: 5 }])
 *     .withOrderBy(["rap.year"])
 *     .build();
 */
export function buildPayload(
  datasets: DatasetRef[],
  columns: string[],
): PayloadBuilder {
  return new PayloadBuilder(datasets, columns);
}

class PayloadBuilder {
  private payload: QueryPayload;

  constructor(datasets: DatasetRef[], columns: string[]) {
    this.payload = { datasets, columns };
  }

  withFilters(filters: QueryFilter[]): this {
    this.payload.filters = filters;
    return this;
  }

  withJoins(joins: JoinClause[]): this {
    this.payload.joins = joins;
    return this;
  }

  withAggregations(aggregations: Aggregation[]): this {
    this.payload.aggregations = aggregations;
    return this;
  }

  withGroupBy(groupBy: string[]): this {
    this.payload.group_by = groupBy;
    return this;
  }

  withOrderBy(orderBy: string[]): this {
    this.payload.order_by = orderBy;
    return this;
  }

  withLimit(limit: number): this {
    this.payload.limit = limit;
    return this;
  }

  withScenario(scenario: string): this {
    this.payload.scenario = scenario;
    return this;
  }

  withDebugFlags(schema?: boolean, sql?: boolean): this {
    if (typeof schema !== "undefined") this.payload.include_schema = schema;
    if (typeof sql !== "undefined") this.payload.include_sql = sql;
    return this;
  }

  build(): QueryPayload {
    return { ...this.payload };
  }
}
