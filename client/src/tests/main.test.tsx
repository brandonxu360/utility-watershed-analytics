import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({ render: mockRender }));

vi.mock("react-dom/client", () => ({
  createRoot: mockCreateRoot,
}));

vi.mock("../App", () => ({
  default: () => <div data-testid="app">App</div>,
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

vi.mock("react-toastify", () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  Zoom: "zoom-transition",
}));

describe("main.tsx Tests", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    container.id = "root";
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("creates root with the root element", async () => {
    await import("../main");

    expect(mockCreateRoot).toHaveBeenCalledWith(container);
  });

  it("calls render on the root", async () => {
    vi.resetModules();

    await import("../main");

    expect(mockRender).toHaveBeenCalled();
  });

  it("renders within StrictMode", async () => {
    vi.resetModules();

    await import("../main");

    expect(mockRender).toHaveBeenCalled();
    const renderCall = mockRender.mock.calls[0][0];
    expect(renderCall.type.toString()).toContain("react.strict_mode");
  });
});
