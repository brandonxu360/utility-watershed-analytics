/**
 * Zustand store — now empty.
 *
 * All watershed-scoped state has been migrated to WatershedContext.
 * This file is kept temporarily for backward compatibility with tests
 * that reference `useAppStore`. It will be removed once all tests are updated.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AppState = {};

export const useAppStore = create<AppState>()(
  devtools(() => ({}), { name: "app-store" }),
);
