import '@testing-library/jest-dom';

/**
 * Minimal ResizeObserver polyfill for the test environment.
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
