import { describe, it, expect } from "vitest";
import { ApiError, isApiError, checkResponse } from "../api/errors";

describe("ApiError", () => {
  it("sets all fields from constructor options", () => {
    const err = new ApiError("boom", {
      status: 404,
      statusText: "Not Found",
      body: { detail: "missing" },
      url: "/api/test",
      runId: "run-1",
      prefix: "Test",
    });

    expect(err.message).toBe("boom");
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(404);
    expect(err.statusText).toBe("Not Found");
    expect(err.body).toEqual({ detail: "missing" });
    expect(err.url).toBe("/api/test");
    expect(err.runId).toBe("run-1");
    expect(err.prefix).toBe("Test");
  });

  it("defaults statusText to empty string", () => {
    const err = new ApiError("fail", { status: 500 });
    expect(err.statusText).toBe("");
  });

  it("is an instance of Error", () => {
    const err = new ApiError("fail", { status: 500 });
    expect(err).toBeInstanceOf(Error);
  });

  it("sets cause when original is provided", () => {
    const cause = new TypeError("network");
    const err = new ApiError("fail", { status: 0, original: cause });
    expect(err.cause).toBe(cause);
    expect(err.original).toBe(cause);
  });

  it("does not set cause when original is absent", () => {
    const err = new ApiError("fail", { status: 500 });
    expect(err.cause).toBeUndefined();
  });
});

describe("isApiError", () => {
  it("returns true for ApiError instances", () => {
    expect(isApiError(new ApiError("x", { status: 400 }))).toBe(true);
  });

  it("returns false for plain Error", () => {
    expect(isApiError(new Error("plain"))).toBe(false);
  });

  it("returns false for non-errors", () => {
    expect(isApiError(null)).toBe(false);
    expect(isApiError("string")).toBe(false);
    expect(isApiError({ status: 400 })).toBe(false);
  });
});

describe("checkResponse", () => {
  function fakeResponse(
    status: number,
    body: string,
    statusText = "OK",
  ): Response {
    return new Response(body, { status, statusText });
  }

  it("returns parsed JSON on success", async () => {
    const res = fakeResponse(200, JSON.stringify({ data: [1, 2] }));
    const result = await checkResponse(res);
    expect(result).toEqual({ data: [1, 2] });
  });

  it("returns plain text when body is not JSON", async () => {
    const res = fakeResponse(200, "plain text");
    const result = await checkResponse(res);
    expect(result).toBe("plain text");
  });

  it("returns empty string for empty body", async () => {
    const res = fakeResponse(200, "");
    const result = await checkResponse(res);
    expect(result).toBe("");
  });

  it("throws ApiError on non-ok status", async () => {
    const res = fakeResponse(404, '{"detail":"not found"}', "Not Found");

    await expect(
      checkResponse(res, { prefix: "Test", url: "/api/x" }),
    ).rejects.toThrow(ApiError);

    try {
      await checkResponse(
        fakeResponse(404, '{"detail":"not found"}', "Not Found"),
        { prefix: "Test", url: "/api/x" },
      );
    } catch (e) {
      const err = e as ApiError;
      expect(err.status).toBe(404);
      expect(err.statusText).toBe("Not Found");
      expect(err.body).toEqual({ detail: "not found" });
      expect(err.url).toBe("/api/x");
      expect(err.prefix).toBe("Test");
      expect(err.message).toContain("Test");
      expect(err.message).toContain("404");
    }
  });

  it("includes non-JSON body as text in ApiError", async () => {
    const res = fakeResponse(500, "Internal Server Error", "Server Error");

    try {
      await checkResponse(res);
    } catch (e) {
      const err = e as ApiError;
      expect(err.body).toBe("Internal Server Error");
    }
  });

  it("uses 'API' as default prefix", async () => {
    const res = fakeResponse(400, "");

    try {
      await checkResponse(res);
    } catch (e) {
      expect((e as ApiError).message).toMatch(/^API request failed/);
    }
  });
});
