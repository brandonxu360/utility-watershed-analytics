import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SbsColormapResponse } from "../api/types/sbs";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { fetchSbsColormap } = await import("../api/sbsApi");

const MOCK_RESPONSE: SbsColormapResponse = {
  mode: "legacy",
  entries: [
    {
      class_value: 130,
      label: "Unburned",
      rgba: [0, 158, 115, 255],
      hex: "#009E73",
    },
    {
      class_value: 131,
      label: "Low",
      rgba: [230, 159, 0, 255],
      hex: "#E69F00",
    },
    {
      class_value: 132,
      label: "Moderate",
      rgba: [86, 180, 233, 255],
      hex: "#56B4E9",
    },
    {
      class_value: 133,
      label: "High",
      rgba: [213, 94, 0, 255],
      hex: "#D55E00",
    },
  ],
};

function jsonResponse(body: unknown, status = 200, statusText = "OK") {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: () => Promise.resolve(text),
    json: () => Promise.resolve(body),
  };
}

describe("sbsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchSbsColormap", () => {
    it("fetches colormap with default mode 'legacy'", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_RESPONSE));

      const result = await fetchSbsColormap();

      expect(mockFetch).toHaveBeenCalledOnce();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("mode=legacy");
      expect(result).toEqual(MOCK_RESPONSE);
    });

    it("fetches colormap with explicit mode 'shift'", async () => {
      const shiftResponse = { ...MOCK_RESPONSE, mode: "shift" as const };
      mockFetch.mockResolvedValueOnce(jsonResponse(shiftResponse));

      const result = await fetchSbsColormap("shift");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("mode=shift");
      expect(result.mode).toBe("shift");
    });

    it("fetches colormap with explicit mode 'legacy'", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_RESPONSE));

      const result = await fetchSbsColormap("legacy");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("mode=legacy");
      expect(result).toEqual(MOCK_RESPONSE);
    });

    it("throws on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(null, 500, "Internal Server Error"),
      );

      await expect(fetchSbsColormap()).rejects.toThrow(
        "SBS Colormap request failed: 500 Internal Server Error",
      );
    });

    it("throws on 404 response", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(null, 404, "Not Found"));

      await expect(fetchSbsColormap()).rejects.toThrow(
        "SBS Colormap request failed: 404 Not Found",
      );
    });

    it("constructs URL from SBS_COLORMAP endpoint", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(MOCK_RESPONSE));

      await fetchSbsColormap();

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/sbs/colormap");
    });

    it("propagates fetch errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      await expect(fetchSbsColormap()).rejects.toThrow("Network failure");
    });
  });
});
