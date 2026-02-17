import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";

function TestComp() {
  const isSmall = useIsSmallScreen();
  return <div data-testid="flag">{isSmall ? "small" : "large"}</div>;
}

describe("useIsSmallScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("returns true when width < 768", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).innerWidth = 500;
    render(<TestComp />);
    expect(screen.getByTestId("flag").textContent).toBe("small");
  });

  it("returns false when width >= 768", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).innerWidth = 1024;
    render(<TestComp />);
    expect(screen.getByTestId("flag").textContent).toBe("large");
  });

  it("updates on resize events", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).innerWidth = 500;
    render(<TestComp />);
    expect(screen.getByTestId("flag").textContent).toBe("small");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).innerWidth = 900;
    fireEvent(window, new Event("resize"));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByTestId("flag").textContent).toBe("large");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).innerWidth = 600;
    fireEvent(window, new Event("resize"));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByTestId("flag").textContent).toBe("small");
  });
});
