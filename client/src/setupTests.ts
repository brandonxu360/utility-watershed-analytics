import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import theme from "./utils/theme";

/**
 * Create a new QueryClient for each test.
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

/**
 * Wrap @testing-library/react render with ThemeProvider and QueryClientProvider.
 * This ensures all tests have access to the MUI theme and React Query context.
 */
vi.mock("@testing-library/react", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@testing-library/react")>();
  return {
    ...original,
    render: (
      ui: React.ReactElement,
      options?: Parameters<typeof original.render>[1],
    ) =>
      original.render(ui, {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: createTestQueryClient() },
            React.createElement(ThemeProvider, { theme }, children),
          ),
        ...options,
      }),
    renderHook: <TResult, TProps>(
      hook: (props: TProps) => TResult,
      options?: Parameters<typeof original.renderHook<TResult, TProps>>[1],
    ) =>
      original.renderHook(hook, {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: createTestQueryClient() },
            React.createElement(ThemeProvider, { theme }, children),
          ),
        ...options,
      }),
  };
});

/**
 * Minimal ResizeObserver polyfill for the test environment.
 * Required for components that use ResizeObserver (e.g., Recharts).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = class {
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
vi.mock(
  "recharts",
  async (importOriginal: () => Promise<typeof import("recharts")>) => {
    const originalModule = await importOriginal();
    return {
      ...originalModule,
      ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          "div",
          { style: { width: 800, height: 400 } },
          children,
        ),
    };
  },
);
