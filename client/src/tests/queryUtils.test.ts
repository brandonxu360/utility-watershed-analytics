import { describe, it, expect } from 'vitest';
import { buildRunPath, extractRows, toFiniteNumber, DEFAULT_RUN_ID, BATCH_PREFIX } from '../api/queryUtils';

describe('queryUtils', () => {
    describe('buildRunPath', () => {
        it('returns default path when no argument provided', () => {
            const result = buildRunPath();
            expect(result).toBe(`${BATCH_PREFIX}${DEFAULT_RUN_ID}`);
        });

        it('prepends batch prefix to simple run ID', () => {
            const result = buildRunPath('my-run-123');
            expect(result).toBe(`${BATCH_PREFIX}my-run-123`);
        });

        it('preserves already prefixed batch paths', () => {
            const fullPath = 'batch;;some-batch;;my-run';
            const result = buildRunPath(fullPath);
            expect(result).toBe(fullPath);
        });

        it('uses custom default run ID when provided', () => {
            const result = buildRunPath(undefined, 'custom-default');
            expect(result).toBe(`${BATCH_PREFIX}custom-default`);
        });

        // Security: Path traversal prevention
        it('throws error for path traversal with ..', () => {
            expect(() => buildRunPath('../etc/passwd')).toThrow('Invalid run path');
            expect(() => buildRunPath('valid/../sneaky')).toThrow('Invalid run path');
            expect(() => buildRunPath('..%2F..%2Fetc')).toThrow('Invalid run path'); // Still contains .. at start
            // URL-encoded path traversal attempts are also blocked (decoded before check)
            expect(() => buildRunPath('%2e%2e/etc/passwd')).toThrow('Invalid run path');
        });

        it('throws error for path with double slashes', () => {
            expect(() => buildRunPath('path//to//file')).toThrow('Invalid run path');
            expect(() => buildRunPath('//root')).toThrow('Invalid run path');
        });

        it('allows valid paths with single slashes', () => {
            expect(() => buildRunPath('or/wa-108')).not.toThrow();
            expect(buildRunPath('or/wa-108')).toBe(`${BATCH_PREFIX}or/wa-108`);
        });

        it('handles empty string', () => {
            const result = buildRunPath('');
            expect(result).toBe(`${BATCH_PREFIX}${DEFAULT_RUN_ID}`);
        });
    });

    describe('extractRows', () => {
        it('returns array directly if input is array', () => {
            const input = [{ id: 1 }, { id: 2 }];
            expect(extractRows(input)).toBe(input);
        });

        it('extracts records property', () => {
            const records = [{ id: 1 }];
            expect(extractRows({ records })).toBe(records);
        });

        it('extracts rows property', () => {
            const rows = [{ id: 1 }];
            expect(extractRows({ rows })).toBe(rows);
        });

        it('extracts data property', () => {
            const data = [{ id: 1 }];
            expect(extractRows({ data })).toBe(data);
        });

        it('extracts nested result.records', () => {
            const records = [{ id: 1 }];
            expect(extractRows({ result: { records } })).toBe(records);
        });

        it('returns empty array for unrecognized format', () => {
            expect(extractRows({ unknown: 'format' })).toEqual([]);
            expect(extractRows('string')).toEqual([]);
            expect(extractRows(123)).toEqual([]);
        });
    });

    describe('toFiniteNumber', () => {
        it('converts valid numbers', () => {
            expect(toFiniteNumber(42)).toBe(42);
            expect(toFiniteNumber(3.14)).toBe(3.14);
            expect(toFiniteNumber(-100)).toBe(-100);
            expect(toFiniteNumber(0)).toBe(0);
        });

        it('converts numeric strings', () => {
            expect(toFiniteNumber('42')).toBe(42);
            expect(toFiniteNumber('3.14')).toBe(3.14);
            expect(toFiniteNumber('-100')).toBe(-100);
        });

        it('returns fallback for NaN', () => {
            expect(toFiniteNumber(NaN)).toBe(0);
            expect(toFiniteNumber(NaN, 999)).toBe(999);
        });

        it('returns fallback for Infinity', () => {
            expect(toFiniteNumber(Infinity)).toBe(0);
            expect(toFiniteNumber(-Infinity)).toBe(0);
            expect(toFiniteNumber(Infinity, -1)).toBe(-1);
        });

        it('returns fallback for non-numeric values', () => {
            expect(toFiniteNumber(null)).toBe(0);
            expect(toFiniteNumber(undefined)).toBe(0);
            expect(toFiniteNumber('not a number')).toBe(0);
            expect(toFiniteNumber({})).toBe(0);
            expect(toFiniteNumber([])).toBe(0);
        });

        it('uses custom fallback value', () => {
            expect(toFiniteNumber('invalid', 42)).toBe(42);
            expect(toFiniteNumber(undefined, -1)).toBe(-1);
            expect(toFiniteNumber(NaN, -1)).toBe(-1);
        });
    });
});
