import { describe, it, expect } from "vitest";
import { extractRows, toFiniteNumber } from "../api/queryUtils";

describe("queryUtils", () => {
  describe("extractRows", () => {
    it("returns array directly if input is array", () => {
      const input = [{ id: 1 }, { id: 2 }];
      expect(extractRows(input)).toBe(input);
    });

    it("extracts records property", () => {
      const records = [{ id: 1 }];
      expect(extractRows({ records })).toBe(records);
    });

    it("extracts rows property", () => {
      const rows = [{ id: 1 }];
      expect(extractRows({ rows })).toBe(rows);
    });

    it("extracts data property", () => {
      const data = [{ id: 1 }];
      expect(extractRows({ data })).toBe(data);
    });

    it("extracts nested result.records", () => {
      const records = [{ id: 1 }];
      expect(extractRows({ result: { records } })).toBe(records);
    });

    it("returns empty array for unrecognized format", () => {
      expect(extractRows({ unknown: "format" })).toEqual([]);
      expect(extractRows("string")).toEqual([]);
      expect(extractRows(123)).toEqual([]);
    });
  });

  describe("toFiniteNumber", () => {
    it("converts valid numbers", () => {
      expect(toFiniteNumber(42)).toBe(42);
      expect(toFiniteNumber(3.14)).toBe(3.14);
      expect(toFiniteNumber(-100)).toBe(-100);
      expect(toFiniteNumber(0)).toBe(0);
    });

    it("converts numeric strings", () => {
      expect(toFiniteNumber("42")).toBe(42);
      expect(toFiniteNumber("3.14")).toBe(3.14);
      expect(toFiniteNumber("-100")).toBe(-100);
    });

    it("returns fallback for NaN", () => {
      expect(toFiniteNumber(NaN)).toBe(0);
      expect(toFiniteNumber(NaN, 999)).toBe(999);
    });

    it("returns fallback for Infinity", () => {
      expect(toFiniteNumber(Infinity)).toBe(0);
      expect(toFiniteNumber(-Infinity)).toBe(0);
      expect(toFiniteNumber(Infinity, -1)).toBe(-1);
    });

    it("returns fallback for non-numeric values", () => {
      expect(toFiniteNumber(null)).toBe(0);
      expect(toFiniteNumber(undefined)).toBe(0);
      expect(toFiniteNumber("not a number")).toBe(0);
      expect(toFiniteNumber({})).toBe(0);
      expect(toFiniteNumber([])).toBe(0);
    });

    it("uses custom fallback value", () => {
      expect(toFiniteNumber("invalid", 42)).toBe(42);
      expect(toFiniteNumber(undefined, -1)).toBe(-1);
      expect(toFiniteNumber(NaN, -1)).toBe(-1);
    });
  });
});
