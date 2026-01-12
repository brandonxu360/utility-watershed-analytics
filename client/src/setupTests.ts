import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

/**
 * Minimal ResizeObserver polyfill for the test environment.
 * Required for components that use ResizeObserver (e.g., Recharts).
 */
; (globalThis as any).ResizeObserver = class { // eslint-disable-line @typescript-eslint/no-explicit-any
    observe() {
        // no-op
    }
    unobserve() {
        // no-op
    }
    disconnect() {
        // no-op
    }
};

/**
 * Mock Recharts ResponsiveContainer to provide fixed dimensions in jsdom.
 * This prevents "width(0) and height(0)" warnings in tests.
 */
vi.mock('recharts', async (importOriginal: () => Promise<typeof import('recharts')>) => {
    const originalModule = await importOriginal();
    return {
        ...originalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
            React.createElement('div', { style: { width: 800, height: 400 } }, children),
    };
});
