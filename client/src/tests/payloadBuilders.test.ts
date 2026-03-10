import { describe, it, expect } from "vitest";
import { buildPayload } from "../api/payloadBuilders";

const DS = [{ path: "rap/rap_ts.parquet", alias: "rap" }];
const COLS = ["rap.year AS year", "rap.value AS value"];

describe("buildPayload", () => {
  it("creates a minimal payload with datasets and columns", () => {
    const payload = buildPayload(DS, COLS).build();
    expect(payload).toEqual({ datasets: DS, columns: COLS });
  });

  it("supports chaining all optional setters", () => {
    const payload = buildPayload(DS, COLS)
      .withFilters([{ column: "rap.year", operator: ">=", value: 2000 }])
      .withJoins([
        {
          left: "rap",
          right: "other",
          on: ["rap.id = other.id"],
        },
      ])
      .withAggregations([{ alias: "avg_value", expression: "AVG(rap.value)" }])
      .withGroupBy(["rap.year"])
      .withOrderBy(["rap.year"])
      .withLimit(100)
      .withScenario("fire")
      .withDebugFlags(true, true)
      .build();

    expect(payload.datasets).toEqual(DS);
    expect(payload.columns).toEqual(COLS);
    expect(payload.filters).toHaveLength(1);
    expect(payload.joins).toHaveLength(1);
    expect(payload.aggregations).toHaveLength(1);
    expect(payload.group_by).toEqual(["rap.year"]);
    expect(payload.order_by).toEqual(["rap.year"]);
    expect(payload.limit).toBe(100);
    expect(payload.scenario).toBe("fire");
    expect(payload.include_schema).toBe(true);
    expect(payload.include_sql).toBe(true);
  });

  it("returns a copy from build() — mutations don't affect the result", () => {
    const builder = buildPayload(DS, COLS).withLimit(50);
    const first = builder.build();
    const second = builder.build();

    expect(first).toEqual(second);
    expect(first).not.toBe(second); // different references
  });

  it("withDebugFlags skips undefined flags", () => {
    const payload = buildPayload(DS, COLS)
      .withDebugFlags(undefined, true)
      .build();

    expect(payload.include_schema).toBeUndefined();
    expect(payload.include_sql).toBe(true);
  });

  it("each setter returns the same builder (fluent)", () => {
    const builder = buildPayload(DS, COLS);
    expect(builder.withFilters([])).toBe(builder);
    expect(builder.withJoins([])).toBe(builder);
    expect(builder.withAggregations([])).toBe(builder);
    expect(builder.withGroupBy([])).toBe(builder);
    expect(builder.withOrderBy([])).toBe(builder);
    expect(builder.withLimit(1)).toBe(builder);
    expect(builder.withScenario("x")).toBe(builder);
    expect(builder.withDebugFlags()).toBe(builder);
  });
});
