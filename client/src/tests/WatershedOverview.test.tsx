import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "../store/store";
import WatershedOverview from "../components/side-panels/WatershedOverview";

const mockNavigate = vi.fn();

const { mockUseMatch } = vi.hoisted(() => ({
  mockUseMatch: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useMatch: () => mockUseMatch(),
    useNavigate: () => mockNavigate,
  });
});

const mockFetchWatersheds = vi.fn();

vi.mock("../api/api", () => ({
  fetchWatersheds: () => mockFetchWatersheds(),
}));

// Sample watershed data
const mockWatershedData = {
  features: [
    {
      id: "test-watershed-123",
      properties: {
        pws_name: "Test Watershed",
        county_nam: "Test County",
        shape_area: 50000,
        num_customers: 1500,
        srctype: "Surface Water",
      },
    },
    {
      id: "test-watershed-456",
      properties: {
        pws_name: "Another Watershed",
        county_nam: "Another County",
        shape_area: 75000,
        num_customers: 2500,
        srctype: "Ground Water",
      },
    },
  ],
};

// Helper to create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe("WatershedOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    useAppStore.setState({
      resetOverlays: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("renders skeleton panel while loading", () => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-123" },
      });
      mockFetchWatersheds.mockReturnValue(new Promise(() => {})); // Never resolves

      renderWithProviders(<WatershedOverview />);

      expect(screen.getByTestId("skeleton-panel")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-title-text")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-close-button")).toBeInTheDocument();
    });

    it("renders skeleton buttons while loading", () => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-123" },
      });
      mockFetchWatersheds.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<WatershedOverview />);

      const skeletonButtons = screen.getAllByTestId("skeleton-button");
      expect(skeletonButtons.length).toBeGreaterThan(0);
    });
  });

  describe("error state", () => {
    it("renders error message when fetch fails", async () => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-123" },
      });
      mockFetchWatersheds.mockRejectedValue(new Error("Network error"));

      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("no data states", () => {
    it("renders message when no watershed data is found", async () => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-123" },
      });
      mockFetchWatersheds.mockResolvedValue({ features: null });

      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(
          screen.getByText("No watershed data found."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("successful rendering", () => {
    beforeEach(() => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-123" },
      });
      mockFetchWatersheds.mockResolvedValue(mockWatershedData);
    });

    it("renders watershed name", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Test Watershed")).toBeInTheDocument();
      });
    });

    it("renders watershed properties", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText(/Test County/)).toBeInTheDocument();
        expect(screen.getByText(/1500/)).toBeInTheDocument();
        expect(screen.getByText(/Surface Water/)).toBeInTheDocument();
      });
    });

    it("renders area value", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        // shape_area is displayed as-is with toFixed(2)
        expect(screen.getByText(/50000\.00/)).toBeInTheDocument();
      });
    });

    it("renders back button", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        const backButton = screen.getByRole("button", {
          name: /close watershed panel/i,
        });
        expect(backButton).toBeInTheDocument();
        expect(backButton).toHaveTextContent("BACK");
      });
    });

    it("renders watershed model buttons", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /View Calibrated WEPP Results/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", {
            name: /View Calibrated RHESSys Results/i,
          }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", {
            name: /View Detailed WEPP Model Results/i,
          }),
        ).toBeInTheDocument();
      });
    });

    it("renders watershed models section heading", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Watershed Models")).toBeInTheDocument();
      });
    });
  });

  describe("navigation", () => {
    beforeEach(() => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-123" },
      });
      mockFetchWatersheds.mockResolvedValue(mockWatershedData);
    });

    it("navigates to home when back button is clicked", async () => {
      const mockResetOverlays = vi.fn();
      useAppStore.setState({ resetOverlays: mockResetOverlays });

      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Test Watershed")).toBeInTheDocument();
      });

      const backButton = screen.getByRole("button", {
        name: /close watershed panel/i,
      });
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
    });

    it("calls resetOverlays when back button is clicked", async () => {
      const mockResetOverlays = vi.fn();
      useAppStore.setState({ resetOverlays: mockResetOverlays });

      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Test Watershed")).toBeInTheDocument();
      });

      const backButton = screen.getByRole("button", {
        name: /close watershed panel/i,
      });
      fireEvent.click(backButton);

      expect(mockResetOverlays).toHaveBeenCalled();
    });
  });

  describe("N/A fallbacks", () => {
    it("renders N/A when county is not available", async () => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-na" },
      });
      mockFetchWatersheds.mockResolvedValue({
        features: [
          {
            id: "test-watershed-na",
            properties: {
              pws_name: "Test Watershed NA",
              county_nam: null,
              shape_area: null,
              num_customers: null,
              srctype: null,
            },
          },
        ],
      });

      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        const naElements = screen.getAllByText("N/A");
        expect(naElements.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe("different watershed selection", () => {
    it("renders correct watershed when ID changes", async () => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-456" },
      });
      mockFetchWatersheds.mockResolvedValue(mockWatershedData);

      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Another Watershed")).toBeInTheDocument();
        expect(screen.getByText(/Another County/)).toBeInTheDocument();
        expect(screen.getByText(/Ground Water/)).toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-123" },
      });
      mockFetchWatersheds.mockResolvedValue(mockWatershedData);
    });

    it("back button has proper aria-label", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        const backButton = screen.getByRole("button", {
          name: /close watershed panel/i,
        });
        expect(backButton).toHaveAttribute(
          "aria-label",
          "Close watershed panel",
        );
      });
    });

    it("back button has proper title attribute", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        const backButton = screen.getByRole("button", {
          name: /close watershed panel/i,
        });
        expect(backButton).toHaveAttribute("title", "Close watershed panel");
      });
    });

    it("action buttons have proper aria-labels", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        const weppButton = screen.getByRole("button", {
          name: /View Calibrated WEPP Results/i,
        });
        expect(weppButton).toHaveAttribute(
          "aria-label",
          "View Calibrated WEPP Results",
        );

        const rhessysButton = screen.getByRole("button", {
          name: /View Calibrated RHESSys Results/i,
        });
        expect(rhessysButton).toHaveAttribute(
          "aria-label",
          "View Calibrated RHESSys Results",
        );
      });
    });
  });
});
