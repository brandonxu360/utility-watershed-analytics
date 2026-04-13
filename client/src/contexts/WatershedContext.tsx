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

export interface WatershedState {
  layerDesired: DesiredMap;
  layerRuntime: LayerRuntime;
  selectedHillslopeId: number | null;
}

const INITIAL_STATE: WatershedState = {
  layerDesired: INITIAL_DESIRED,
  layerRuntime: INITIAL_RUNTIME,
  selectedHillslopeId: null,
};

export type WatershedAction =
  | LayerAction
  | {
      type: "SET_DATA_AVAILABILITY";
      id: LayerId;
      available: boolean | undefined;
    }
  | { type: "SET_LAYER_LOADING"; id: LayerId; loading: boolean }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_SELECTED_HILLSLOPE"; id: number | null }
  | { type: "CLEAR_SELECTED_HILLSLOPE" };

function watershedReducer(
  state: WatershedState,
  action: WatershedAction,
): WatershedState {
  switch (action.type) {
    case "TOGGLE":
    case "SET_OPACITY":
    case "SET_PARAM":
    case "ENABLE_WITH_PARAMS":
      return {
        ...state,
        layerDesired: applyAction(state.layerDesired, action),
      };

    case "RESET":
      return INITIAL_STATE;

    case "SET_DATA_AVAILABILITY":
      if (state.layerRuntime.dataAvailability[action.id] === action.available)
        return state;
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
      if (state.layerRuntime.loading[action.id] === action.loading) return state;
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

    case "SET_SELECTED_HILLSLOPE":
      return { ...state, selectedHillslopeId: action.id };

    case "CLEAR_SELECTED_HILLSLOPE":
      return { ...state, selectedHillslopeId: null };

    default:
      return state;
  }
}

export interface WatershedContextValue {
  layerDesired: DesiredMap;
  layerRuntime: LayerRuntime;
  selectedHillslopeId: number | null;

  dispatch: (action: WatershedAction) => void;

  dispatchLayerAction: (action: LayerAction) => void;
  enableLayerWithParams: (id: LayerId, params: Record<string, unknown>) => void;
  setDataAvailability: (id: LayerId, available: boolean | undefined) => void;
  setLayerLoading: (id: LayerId, loading: boolean) => void;
  setZoom: (zoom: number) => void;
  setSelectedHillslope: (id: number | null) => void;
  clearSelectedHillslope: () => void;

  effective: EffectiveMap;
  activeIds: LayerId[];
  isBlocked: (id: LayerId) => boolean;
  isEffective: (id: LayerId) => boolean;
}

const WatershedContext = createContext<WatershedContextValue | null>(null);

interface WatershedProviderProps {
  runId: string | null;
  children: ReactNode;
}

export function WatershedProvider({ runId, children }: WatershedProviderProps) {
  const [state, dispatch] = useReducer(watershedReducer, INITIAL_STATE);

  // Reset on watershed change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch({ type: "RESET" });
  }, [runId]);

  const dispatchLayerAction = useCallback(
    (action: LayerAction) => dispatch(action),
    [],
  );

  const enableLayerWithParams = useCallback(
    (id: LayerId, params: Record<string, unknown>) =>
      dispatch({ type: "ENABLE_WITH_PARAMS", id, params }),
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

  const setSelectedHillslope = useCallback(
    (id: number | null) => dispatch({ type: "SET_SELECTED_HILLSLOPE", id }),
    [],
  );

  const clearSelectedHillslope = useCallback(
    () => dispatch({ type: "CLEAR_SELECTED_HILLSLOPE" }),
    [],
  );

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

  const value = useMemo<WatershedContextValue>(
    () => ({
      layerDesired: state.layerDesired,
      layerRuntime: state.layerRuntime,
      selectedHillslopeId: state.selectedHillslopeId,
      dispatch,
      dispatchLayerAction,
      enableLayerWithParams,
      setDataAvailability,
      setLayerLoading,
      setZoom,
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
      state.selectedHillslopeId,
      dispatchLayerAction,
      enableLayerWithParams,
      setDataAvailability,
      setLayerLoading,
      setZoom,
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

export function useWatershed(): WatershedContextValue {
  const ctx = useContext(WatershedContext);
  if (!ctx) {
    throw new Error("useWatershed must be used within a <WatershedProvider>");
  }
  return ctx;
}
