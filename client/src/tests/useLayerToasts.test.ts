import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { toast } from "react-toastify";
import { INITIAL_DESIRED } from "../layers/rules";
import { ALL_LAYER_IDS } from "../layers/types";

import type {
  DesiredMap,
  EffectiveMap,
  LayerEffectiveState,
  LayerId,
} from "../layers/types";

import { useLayerToasts } from "../hooks/useLayerToasts";

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn() },
}));

function buildEffective(
  overrides: Partial<Record<LayerId, Partial<LayerEffectiveState>>> = {},
): EffectiveMap {
  const base = {} as EffectiveMap;
  for (const id of ALL_LAYER_IDS) {
    base[id] = {
      enabled: false,
      opacity: 0,
      loading: false,
      blockedReasons: [],
      ...overrides[id],
    };
  }
  return base;
}

function desiredWith(...ids: LayerId[]): DesiredMap {
  const d = JSON.parse(JSON.stringify(INITIAL_DESIRED)) as DesiredMap;
  for (const id of ids) d[id].enabled = true;
  return d;
}

describe("useLayerToasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not toast on first render (baseline)", () => {
    const desired = desiredWith("channels");
    const effective = buildEffective({
      channels: {
        enabled: false,
        blockedReasons: [
          {
            kind: "missing-data",
            detail: "WEPP Channels data is not available",
          },
        ],
      },
    });

    renderHook(() => useLayerToasts(desired, effective));

    // First render records baseline — no toast
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts when a layer transitions from enabled to blocked (missing-data)", () => {
    const desired = desiredWith("channels");
    const enabledEffective = buildEffective({
      channels: { enabled: true },
    });
    const blockedEffective = buildEffective({
      channels: {
        enabled: false,
        blockedReasons: [
          { kind: "missing-data", detail: "Channels data is not available" },
        ],
      },
    });

    const { rerender } = renderHook(({ d, e }) => useLayerToasts(d, e), {
      initialProps: { d: desired, e: enabledEffective },
    });

    expect(toast.error).not.toHaveBeenCalled();

    rerender({ d: desired, e: blockedEffective });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Channels data is not available"),
    );
  });

  it("toasts when user toggles on but layer is immediately blocked (requires-layer)", () => {
    const desiredOff = INITIAL_DESIRED;
    const effectiveOff = buildEffective();

    const { rerender } = renderHook(({ d, e }) => useLayerToasts(d, e), {
      initialProps: { d: desiredOff, e: effectiveOff },
    });

    // User toggles landuse on but subcatchment data not available → blocked
    const desiredOn = desiredWith("landuse", "subcatchment");
    const effectiveBlocked = buildEffective({
      subcatchment: {
        enabled: false,
        blockedReasons: [
          {
            kind: "missing-data",
            detail: "Subcatchments data is not available",
          },
        ],
      },
      landuse: {
        enabled: false,
        blockedReasons: [{ kind: "requires-layer", layerId: "subcatchment" }],
      },
    });

    rerender({ d: desiredOn, e: effectiveBlocked });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Requires Subcatchments"),
    );
  });

  it("toasts zoom-out-of-range blocked reason", () => {
    const desired = desiredWith("channels");
    const enabledEffective = buildEffective({
      channels: { enabled: true },
    });

    const { rerender } = renderHook(({ d, e }) => useLayerToasts(d, e), {
      initialProps: { d: desired, e: enabledEffective },
    });

    const blockedEffective = buildEffective({
      channels: {
        enabled: false,
        blockedReasons: [
          {
            kind: "zoom-out-of-range",
            current: 5,
            required: { min: 10, max: 18 },
          },
        ],
      },
    });

    rerender({ d: desired, e: blockedEffective });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Visible at zoom 10–18"),
    );
  });

  it("joins multiple blocked reasons with semicolons", () => {
    const desired = desiredWith("landuse", "subcatchment");
    const enabledEffective = buildEffective({
      subcatchment: { enabled: true },
      landuse: { enabled: true },
    });

    const { rerender } = renderHook(({ d, e }) => useLayerToasts(d, e), {
      initialProps: { d: desired, e: enabledEffective },
    });

    const blockedEffective = buildEffective({
      subcatchment: { enabled: true },
      landuse: {
        enabled: false,
        blockedReasons: [
          { kind: "missing-data", detail: "Land Use data is not available" },
          { kind: "requires-layer", layerId: "subcatchment" },
        ],
      },
    });

    rerender({ d: desired, e: blockedEffective });

    const call = vi.mocked(toast.error).mock.calls[0][0] as string;
    expect(call).toContain(";");
    expect(call).toContain("Land Use data is not available");
  });

  it("does not toast when desired is off", () => {
    const desiredOff = (() => {
      const d = JSON.parse(JSON.stringify(INITIAL_DESIRED)) as DesiredMap;
      for (const id of Object.keys(d))
        d[id as keyof DesiredMap].enabled = false;
      return d;
    })(); // all off
    const enabledEffective = buildEffective({
      channels: { enabled: true },
    });

    const { rerender } = renderHook(({ d, e }) => useLayerToasts(d, e), {
      initialProps: { d: desiredOff, e: enabledEffective },
    });

    const blockedEffective = buildEffective({
      channels: {
        enabled: false,
        blockedReasons: [{ kind: "missing-data", detail: "No data" }],
      },
    });

    rerender({ d: desiredOff, e: blockedEffective });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("does not toast when effective stays enabled", () => {
    const desired = desiredWith("channels");
    const enabledEffective = buildEffective({
      channels: { enabled: true },
    });

    const { rerender } = renderHook(({ d, e }) => useLayerToasts(d, e), {
      initialProps: { d: desired, e: enabledEffective },
    });

    // Still enabled
    rerender({ d: desired, e: enabledEffective });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("does not toast when blocked reasons array is empty", () => {
    const desired = desiredWith("channels");
    const enabledEffective = buildEffective({
      channels: { enabled: true },
    });

    const { rerender } = renderHook(({ d, e }) => useLayerToasts(d, e), {
      initialProps: { d: desired, e: enabledEffective },
    });

    // Blocked but no reasons (edge case)
    const blockedNoReasons = buildEffective({
      channels: { enabled: false, blockedReasons: [] },
    });

    rerender({ d: desired, e: blockedNoReasons });

    expect(toast.error).not.toHaveBeenCalled();
  });
});
