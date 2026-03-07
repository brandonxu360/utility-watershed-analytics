import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WatershedOverview from "../components/side-panels/WatershedOverview";

const mockNavigate = vi.fn();

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  });
});

vi.mock("../components/side-panels/DataLayers", () => ({
  default: () => <div data-testid="data-layers-side-panel" />,
}));

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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("renders skeleton panel while loading", () => {
      mockUseParams.mockReturnValue("test-watershed-123");
      mockFetchWatersheds.mockReturnValue(new Promise(() => {})); // Never resolves

      renderWithProviders(<WatershedOverview />);

      expect(screen.getByTestId("skeleton-panel")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-title-text")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-close-button")).toBeInTheDocument();
    });

    it("renders skeleton buttons while loading", () => {
      mockUseParams.mockReturnValue("test-watershed-123");
      mockFetchWatersheds.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<WatershedOverview />);

      const skeletonButtons = screen.getAllByTestId("skeleton-button");
      expect(skeletonButtons.length).toBeGreaterThan(0);
    });
  });

  describe("error state", () => {
    it("renders error message when fetch fails", async () => {
      mockUseParams.mockReturnValue("test-watershed-123");
      mockFetchWatersheds.mockRejectedValue(new Error("Network error"));

      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("no data states", () => {
    it("renders message when no watershed data is found", async () => {
      mockUseParams.mockReturnValue("test-watershed-123");
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
      mockUseParams.mockReturnValue("test-watershed-123");
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

    it("renders watershed model accordion sections", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Short Term Impact")).toBeInTheDocument();
        expect(screen.getByText("Long Term Impact")).toBeInTheDocument();
      });
    });

    it("renders WEPP model results link", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Short Term Impact")).toBeInTheDocument();
      });

      // Expand the Short Term Impact accordion
      fireEvent.click(screen.getByText("Short Term Impact"));

      await waitFor(() => {
        expect(
          screen.getByRole("link", {
            name: /View Detailed WEPP Model Results/i,
          }),
        ).toBeInTheDocument();
      });
    });

    it("renders impact assessment section heading", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Impact Assessment")).toBeInTheDocument();
      });
    });

    it("renders the data layers side panel", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(
          screen.getByTestId("data-layers-side-panel"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("navigation", () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue("test-watershed-123");
      mockFetchWatersheds.mockResolvedValue(mockWatershedData);
    });

    it("navigates to home when back button is clicked", async () => {
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
  });

  describe("N/A fallbacks", () => {
    it("renders N/A when county is not available", async () => {
      mockUseParams.mockReturnValue("test-watershed-na");
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
      mockUseParams.mockReturnValue("test-watershed-456");
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
      mockUseParams.mockReturnValue("test-watershed-123");
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

    it("WEPP model results link has proper aria-label and href", async () => {
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Short Term Impact")).toBeInTheDocument();
      });

      // Expand the Short Term Impact accordion
      fireEvent.click(screen.getByText("Short Term Impact"));

      await waitFor(() => {
        const weppLink = screen.getByRole("link", {
          name: /View Detailed WEPP Model Results/i,
        });
        expect(weppLink).toHaveAttribute(
          "aria-label",
          "View Detailed WEPP Model Results",
        );
        expect(weppLink).toHaveAttribute("href");
        expect(weppLink).toHaveAttribute("target", "_blank");
        expect(weppLink).toHaveAttribute("rel", "noopener noreferrer");
      });
    });
  });

  describe("multi-utility title rendering (huc10_utility_count > 1)", () => {
    const setupMulti = (huc10_pws_names: string | null, pws_name = "Fallback Watershed") => {
      mockUseParams.mockReturnValue("multi-ws");
      mockFetchWatersheds.mockResolvedValue({
        features: [
          {
            id: "multi-ws",
            properties: {
              pws_name,
              huc10_utility_count: 2,
              huc10_pws_names,
              county_nam: "Test County",
              shape_area: 1000,
              srctype: "Surface Water",
            },
          },
        ],
      });
    };

    it("renders each name as a separate title row when huc10_pws_names is well-formed", async () => {
      setupMulti("Alpha Water;Beta Water");
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Alpha Water")).toBeInTheDocument();
        expect(screen.getByText("Beta Water")).toBeInTheDocument();
      });
    });

    it("trims whitespace from each name", async () => {
      setupMulti("  Alpha Water ; Beta Water  ");
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Alpha Water")).toBeInTheDocument();
        expect(screen.getByText("Beta Water")).toBeInTheDocument();
      });
    });

    it("filters out empty entries produced by a trailing semicolon", async () => {
      setupMulti("Alpha Water;Beta Water;");
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Alpha Water")).toBeInTheDocument();
        expect(screen.getByText("Beta Water")).toBeInTheDocument();
      });

      // Only the two real names should appear as title rows — no blank element
      const allStrong = document.querySelectorAll("strong");
      const titleTexts = Array.from(allStrong).map((el) => el.textContent?.trim());
      expect(titleTexts.filter((t) => t === "")).toHaveLength(0);
    });

    it("falls back to pws_name when huc10_pws_names is null", async () => {
      setupMulti(null, "Fallback Watershed");
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Fallback Watershed")).toBeInTheDocument();
      });
    });

    it("falls back to pws_name when huc10_pws_names is an empty string", async () => {
      setupMulti("", "Fallback Watershed");
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Fallback Watershed")).toBeInTheDocument();
      });
    });

    it("falls back to pws_name when huc10_pws_names contains only semicolons", async () => {
      setupMulti(";;;", "Fallback Watershed");
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText("Fallback Watershed")).toBeInTheDocument();
      });
    });
  });

  describe("utility metadata section (owner_type / pop_group / treat_type)", () => {
    const setupWithMeta = (
      overrides: Partial<{
        owner_type: string | null;
        pop_group: string | null;
        treat_type: string | null;
      }>,
    ) => {
      mockUseParams.mockReturnValue("meta-ws");
      mockFetchWatersheds.mockResolvedValue({
        features: [
          {
            id: "meta-ws",
            properties: {
              pws_name: "Meta Watershed",
              county_nam: "Meta County",
              shape_area: 5000,
              srctype: "Surface Water",
              ...overrides,
            },
          },
        ],
      });
    };

    it("renders all three utility metadata fields when all are present", async () => {
      setupWithMeta({
        owner_type: "Local Government",
        pop_group: "100,001 to 500,000",
        treat_type: "Filtration",
      });
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText(/Water Utility Type:/)).toBeInTheDocument();
        expect(screen.getByText(/Local Government/)).toBeInTheDocument();
        expect(screen.getByText(/Customers Served:/)).toBeInTheDocument();
        expect(screen.getByText(/100,001 to 500,000/)).toBeInTheDocument();
        expect(screen.getByText(/Treatment Processes:/)).toBeInTheDocument();
        expect(screen.getByText(/Filtration/)).toBeInTheDocument();
      });
    });

    it("renders the section with N/A placeholders when some fields are null", async () => {
      setupWithMeta({ owner_type: "Local Government", pop_group: null, treat_type: null });
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText(/Water Utility Type:/)).toBeInTheDocument();
        expect(screen.getByText(/Local Government/)).toBeInTheDocument();
        // The two null fields should display N/A
        const naElements = screen.getAllByText("N/A");
        expect(naElements.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("does not render the utility metadata section when all three fields are absent", async () => {
      setupWithMeta({ owner_type: undefined as unknown as null });
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.queryByText(/Water Utility Type:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Customers Served:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Treatment Processes:/)).not.toBeInTheDocument();
      });
    });

    it("renders the section when only one of the three fields is present", async () => {
      setupWithMeta({ owner_type: undefined as unknown as null, pop_group: undefined as unknown as null, treat_type: "Filtration" });
      renderWithProviders(<WatershedOverview />);

      await waitFor(() => {
        expect(screen.getByText(/Treatment Processes:/)).toBeInTheDocument();
        expect(screen.getByText(/Filtration/)).toBeInTheDocument();
      });
    });
  });
});
