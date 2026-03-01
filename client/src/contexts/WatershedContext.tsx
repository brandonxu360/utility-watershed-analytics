/**
 * WatershedContext — ALL watershed-scoped state in a single reducer.
 *
 * ### Automatic reset
 * - Navigate away from Home (e.g. /team) → provider unmounts → state GC'd.
 * - Switch watersheds (runId changes) → RESET dispatched → `INITIAL_STATE`.
 *
 * Adding a new piece of watershed-scoped state means:
 *  1. Add the field + default to `INITIAL_STATE`
 *  2. Add an action case to `watershedReducer`
 *  3. Expose a convenience setter in the context value
 *
 * The RESET action always returns `INITIAL_STATE`, so nothing extra is
 * needed — no manual "enumerate every field to clear" pattern.
 *
 * ### Declarative UI
 * Panel / legend components derive visibility from `isEffective`.
 * They render when their layer is active and vanish when it isn't.
 * There is no `isPanelOpen` or `panelContent` state.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import type {
  DesiredMap,
  LayerAction,
  LayerId,
  LayerRuntime,
  EffectiveMap,
} from "../layers/types";

import { INITIAL_DESIRED, INITIAL_RUNTIME, applyAction } from "../layers/rules";

import {
  evaluate,
  selectOrderedActiveIds,
  isDesiredButBlocked,
} from "../layers/evaluate";

import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";

// ── State shape ─────────────────────────────────────────────────────────────

export interface WatershedState {
  /** What the user toggled on/off, with opacity & params. */
  layerDesired: DesiredMap;
  /** Runtime facts: zoom, data availability, loading flags. */
  layerRuntime: LayerRuntime;
  /** Derived from fetched landuse data — keyed by color → description. */
  landuseLegendMap: Record<string, string>;
  /** Currently selected subcatchment/hillslope (user interaction). */
  selectedHillslopeId: number | null;
  selectedHillslopeProps: SubcatchmentProperties | null;
}

export const INITIAL_STATE: WatershedState = {
  layerDesired: INITIAL_DESIRED,
  layerRuntime: INITIAL_RUNTIME,
  landuseLegendMap: {},
  selectedHillslopeId: null,
  selectedHillslopeProps: null,
};

// ── Actions ─────────────────────────────────────────────────────────────────

export type WatershedAction =
  | LayerAction // TOGGLE, SET_OPACITY, SET_PARAM, RESET
  | {
      type: "SET_DATA_AVAILABILITY";
      id: LayerId;
      available: boolean | undefined;
    }
  | { type: "SET_LAYER_LOADING"; id: LayerId; loading: boolean }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_LANDUSE_LEGEND"; legend: Record<string, string> }
  | {
      type: "SET_SELECTED_HILLSLOPE";
      id: number | null;
      props: SubcatchmentProperties | null;
    }
  | { type: "CLEAR_SELECTED_HILLSLOPE" };

// ── Reducer ─────────────────────────────────────────────────────────────────

export function watershedReducer(
  state: WatershedState,
  action: WatershedAction,
): WatershedState {
  switch (action.type) {
    // ── Layer desired (delegates to pure rule engine) ──
    case "TOGGLE":
    case "SET_OPACITY":
    case "SET_PARAM":
      return {
        ...state,
        layerDesired: applyAction(state.layerDesired, action),
      };

    case "RESET":
      return INITIAL_STATE;

    // ── Runtime facts ──
    case "SET_DATA_AVAILABILITY":
      return {
        ...state,
        layerRuntime: {
          ...state.layerRuntime,
          dataAvailability: {
            ...state.layerRuntime.dataAvailability,
            [action.id]: action.available,
          },
        },
      };

    case "SET_LAYER_LOADING":
      return {
        ...state,
        layerRuntime: {
          ...state.layerRuntime,
          loading: {
            ...state.layerRuntime.loading,
            [action.id]: action.loading,
          },
        },
      };

    case "SET_ZOOM":
      return {
        ...state,
        layerRuntime: { ...state.layerRuntime, zoom: action.zoom },
      };

    // ── Landuse legend ──
    case "SET_LANDUSE_LEGEND":
      return { ...state, landuseLegendMap: action.legend };

    // ── Hillslope selection ──
    case "SET_SELECTED_HILLSLOPE":
      return {
        ...state,
        selectedHillslopeId: action.id,
        selectedHillslopeProps: action.props,
      };

    case "CLEAR_SELECTED_HILLSLOPE":
      return {
        ...state,
        selectedHillslopeId: null,
        selectedHillslopeProps: null,
      };

    default:
      return state;
  }
}

// ── Context value shape ─────────────────────────────────────────────────────

export interface WatershedContextValue {
  // Raw state
  layerDesired: DesiredMap;
  layerRuntime: LayerRuntime;
  landuseLegendMap: Record<string, string>;
  selectedHillslopeId: number | null;
  selectedHillslopeProps: SubcatchmentProperties | null;

  // Dispatch
  dispatch: (action: WatershedAction) => void;

  // Convenience dispatchers (stable refs)
  dispatchLayerAction: (action: LayerAction) => void;
  enableLayerWithParams: (id: LayerId, params: Record<string, unknown>) => void;
  setDataAvailability: (id: LayerId, available: boolean | undefined) => void;
  setLayerLoading: (id: LayerId, loading: boolean) => void;
  setZoom: (zoom: number) => void;
  setLanduseLegendMap: (legend: Record<string, string>) => void;
  setSelectedHillslope: (
    id: number | null,
    props?: SubcatchmentProperties | null,
  ) => void;
  clearSelectedHillslope: () => void;

  // Derived
  effective: EffectiveMap;
  activeIds: LayerId[];
  isBlocked: (id: LayerId) => boolean;
  isEffective: (id: LayerId) => boolean;
}

const WatershedContext = createContext<WatershedContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────

interface WatershedProviderProps {
  runId: string | null;
  children: ReactNode;
}

export function WatershedProvider({ runId, children }: WatershedProviderProps) {
  const [state, dispatch] = useReducer(watershedReducer, INITIAL_STATE);

  // ── Reset on watershed change (skip initial render — already INITIAL_STATE) ──
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch({ type: "RESET" });
  }, [runId]);

  // ── Convenience dispatchers (stable refs) ──

  const dispatchLayerAction = useCallback(
    (action: LayerAction) => dispatch(action),
    [],
  );

  const enableLayerWithParams = useCallback(
    (id: LayerId, params: Record<string, unknown>) => {
      dispatch({ type: "TOGGLE", id, on: true });
      for (const [key, value] of Object.entries(params)) {
        dispatch({ type: "SET_PARAM", id, key, value });
      }
    },
    [],
  );

  const setDataAvailability = useCallback(
    (id: LayerId, available: boolean | undefined) =>
      dispatch({ type: "SET_DATA_AVAILABILITY", id, available }),
    [],
  );

  const setLayerLoading = useCallback(
    (id: LayerId, loading: boolean) =>
      dispatch({ type: "SET_LAYER_LOADING", id, loading }),
    [],
  );

  const setZoom = useCallback(
    (zoom: number) => dispatch({ type: "SET_ZOOM", zoom }),
    [],
  );

  const setLanduseLegendMap = useCallback(
    (legend: Record<string, string>) =>
      dispatch({ type: "SET_LANDUSE_LEGEND", legend }),
    [],
  );

  const setSelectedHillslope = useCallback(
    (id: number | null, props?: SubcatchmentProperties | null) =>
      dispatch({ type: "SET_SELECTED_HILLSLOPE", id, props: props ?? null }),
    [],
  );

  const clearSelectedHillslope = useCallback(
    () => dispatch({ type: "CLEAR_SELECTED_HILLSLOPE" }),
    [],
  );

  // ── Derived state ──

  const effective = useMemo(
    () => evaluate(state.layerDesired, state.layerRuntime),
    [state.layerDesired, state.layerRuntime],
  );

  const activeIds = useMemo(
    () => selectOrderedActiveIds(effective),
    [effective],
  );

  const isBlocked = useCallback(
    (id: LayerId) => isDesiredButBlocked(id, state.layerDesired, effective),
    [state.layerDesired, effective],
  );

  const isEffective = useCallback(
    (id: LayerId) => effective[id].enabled,
    [effective],
  );

  // ── Assemble context value ──

  const value = useMemo<WatershedContextValue>(
    () => ({
      layerDesired: state.layerDesired,
      layerRuntime: state.layerRuntime,
      landuseLegendMap: state.landuseLegendMap,
      selectedHillslopeId: state.selectedHillslopeId,
      selectedHillslopeProps: state.selectedHillslopeProps,
      dispatch,
      dispatchLayerAction,
      enableLayerWithParams,
      setDataAvailability,
      setLayerLoading,
      setZoom,
      setLanduseLegendMap,
      setSelectedHillslope,
      clearSelectedHillslope,
      effective,
      activeIds,
      isBlocked,
      isEffective,
    }),
    [
      state.layerDesired,
      state.layerRuntime,
      state.landuseLegendMap,
      state.selectedHillslopeId,
      state.selectedHillslopeProps,
      dispatchLayerAction,
      enableLayerWithParams,
      setDataAvailability,
      setLayerLoading,
      setZoom,
      setLanduseLegendMap,
      setSelectedHillslope,
      clearSelectedHillslope,
      effective,
      activeIds,
      isBlocked,
      isEffective,
    ],
  );

  return (
    <WatershedContext.Provider value={value}>
      {children}
    </WatershedContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useWatershed(): WatershedContextValue {
  const ctx = useContext(WatershedContext);
  if (!ctx) {
    throw new Error("useWatershed must be used within a <WatershedProvider>");
  }
  return ctx;
}
