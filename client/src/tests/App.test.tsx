import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../App";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    RouterProvider: ({ router }: { router: unknown }) => (
      <div
        role="application"
        aria-label="Router"
        data-router={router ? "provided" : "missing"}
      >
        Router Provider Mock
      </div>
    ),
  });
});

vi.mock("../routes/router", () => ({
  router: { mockRouter: true },
}));

describe("App Component Tests", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(
      screen.getByRole("application", { name: /router/i }),
    ).toBeInTheDocument();
  });

  it("provides router to RouterProvider", () => {
    render(<App />);
    const routerProvider = screen.getByRole("application", { name: /router/i });
    expect(routerProvider).toHaveAttribute("data-router", "provided");
  });
});
