import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScenariosTable } from "../components/bottom-panels/ScenariosTable";
import type { ScenarioSummaryRow } from "../api/scenarioApi";

const { mockUseQuery, mockUseParams, mockDownloadCsv, mockCopyCsv } =
  vi.hoisted(() => ({
    mockUseQuery: vi.fn(),
    mockUseParams: vi.fn(),
    mockDownloadCsv: vi.fn(),
    mockCopyCsv: vi.fn(),
  }));

vi.mock("../utils/download", () => ({
  downloadCsv: mockDownloadCsv,
  copyCsv: mockCopyCsv,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (opts: unknown) => mockUseQuery(opts),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useParams: () => mockUseParams(),
  });
});

const RUN_ID = "test-run-42";

function makeRow(
  overrides: Partial<ScenarioSummaryRow> = {},
): ScenarioSummaryRow {
  return {
    scenario: "undisturbed",
    label: "Current",
    waterDischarge: 50,
    hillslopeSoilLoss: 2,
    channelSoilLoss: 1.5,
    sedimentDischarge: 3,
    hillslopeSoilLossTonnesPerYear: 200,
    channelSoilLossTonnesPerYear: 150,
    sedimentDischargeTonnesPerYear: 300,
    ...overrides,
  };
}

describe("ScenariosTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue(RUN_ID);
  });

  describe("status states", () => {
    it("shows a loading message while the query is in flight", () => {
      mockUseQuery.mockReturnValue({
        isLoading: true,
        isError: false,
        data: undefined,
        error: null,
      });
      render(<ScenariosTable />);
      expect(screen.getByText(/loading scenario data/i)).toBeInTheDocument();
    });

    it("shows a generic error message when the error is not an Error instance", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: true,
        data: undefined,
        error: "string error",
      });
      render(<ScenariosTable />);
      expect(
        screen.getByText(/failed to load scenario data/i),
      ).toBeInTheDocument();
    });

    it("shows the Error message when the error is an Error instance", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: true,
        data: undefined,
        error: new Error("Network timeout"),
      });
      render(<ScenariosTable />);
      expect(screen.getByText("Network timeout")).toBeInTheDocument();
    });

    it("shows the empty-data message when data is an empty array", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [],
        error: null,
      });
      render(<ScenariosTable />);
      expect(
        screen.getByText(/no scenario data available/i),
      ).toBeInTheDocument();
    });

    it("shows the empty-data message when data is undefined", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: undefined,
        error: null,
      });
      render(<ScenariosTable />);
      expect(
        screen.getByText(/no scenario data available/i),
      ).toBeInTheDocument();
    });
  });

  describe("column headers", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow()],
        error: null,
      });
    });

    it("renders the 'Annual Averages' title", () => {
      render(<ScenariosTable />);
      expect(screen.getByText("Annual Averages")).toBeInTheDocument();
    });

    it("renders the Scenario column header", () => {
      render(<ScenariosTable />);
      expect(
        screen.getByRole("columnheader", { name: /scenario/i }),
      ).toBeInTheDocument();
    });

    it("renders the water-discharge header with mm units", () => {
      render(<ScenariosTable />);
      expect(
        screen.getByRole("columnheader", {
          name: /water discharge from outlet \(mm\)/i,
        }),
      ).toBeInTheDocument();
    });

    it("renders the hillslope-soil-loss header with t/ha units", () => {
      render(<ScenariosTable />);
      expect(
        screen.getByRole("columnheader", {
          name: /hillslope soil loss \(t\/ha\)/i,
        }),
      ).toBeInTheDocument();
    });

    it("renders the channel-soil-loss header with t/ha units", () => {
      render(<ScenariosTable />);
      expect(
        screen.getByRole("columnheader", {
          name: /channel soil loss \(t\/ha\)/i,
        }),
      ).toBeInTheDocument();
    });

    it("renders the sediment-discharge header with t/ha units", () => {
      render(<ScenariosTable />);
      expect(
        screen.getByRole("columnheader", {
          name: /sediment discharge from outlet \(t\/ha\)/i,
        }),
      ).toBeInTheDocument();
    });

    it("renders the hillslope-soil-loss-per-year header with t/yr units", () => {
      render(<ScenariosTable />);
      expect(
        screen.getByRole("columnheader", {
          name: /hillslope soil loss \(t\/yr\)/i,
        }),
      ).toBeInTheDocument();
    });

    it("renders the channel-soil-loss-per-year header with t/yr units", () => {
      render(<ScenariosTable />);
      expect(
        screen.getByRole("columnheader", {
          name: /channel soil loss \(t\/yr\)/i,
        }),
      ).toBeInTheDocument();
    });

    it("renders the sediment-discharge-per-year header with t/yr units", () => {
      render(<ScenariosTable />);
      expect(
        screen.getByRole("columnheader", {
          name: /sediment discharge from outlet \(t\/yr\)/i,
        }),
      ).toBeInTheDocument();
    });
  });

  describe("metric values rendered directly", () => {
    it("renders hillslopeSoilLoss value", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ hillslopeSoilLoss: 2 })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("2");
    });

    it("renders channelSoilLoss value", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ channelSoilLoss: 1.5 })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("1.5");
    });

    it("renders sedimentDischarge value", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ sedimentDischarge: 3 })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("3");
    });

    it("renders dash when hillslopeSoilLoss is null", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ hillslopeSoilLoss: null })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("—");
    });

    it("renders dash when channelSoilLoss is null", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ channelSoilLoss: null })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("—");
    });

    it("renders waterDischarge value", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ waterDischarge: 123.45 })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("123.45");
    });

    it("renders dash when waterDischarge is null", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ waterDischarge: null })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("—");
    });

    it("renders hillslopeSoilLossTonnesPerYear value", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ hillslopeSoilLossTonnesPerYear: 42.5 })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("42.5");
    });

    it("renders channelSoilLossTonnesPerYear value", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ channelSoilLossTonnesPerYear: 7.8 })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("7.8");
    });

    it("renders sedimentDischargeTonnesPerYear value", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ sedimentDischargeTonnesPerYear: 12.34 })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("12.34");
    });

    it("renders dash when hillslopeSoilLossTonnesPerYear is null", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ hillslopeSoilLossTonnesPerYear: null })],
        error: null,
      });
      render(<ScenariosTable />);
      const table = screen.getByTestId("scenarios-table");
      expect(table).toHaveTextContent("—");
    });
  });

  describe("formatValue edge-cases", () => {
    function renderWithRow(partial: Partial<ScenarioSummaryRow>) {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow(partial)],
        error: null,
      });
      render(<ScenariosTable />);
      return screen.getByTestId("scenarios-table");
    }

    it("renders '0' when the value is exactly zero", () => {
      const table = renderWithRow({ waterDischarge: 0 });
      expect(table).toHaveTextContent("0");
    });

    it("formats a normal decimal with up to 2 fractional digits", () => {
      const table = renderWithRow({ waterDischarge: 3.14159 });
      expect(table).toHaveTextContent("3.14");
    });
  });

  describe("row rendering", () => {
    it("renders the scenario label in the row header", () => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow({ label: "Current Conditions" })],
        error: null,
      });
      render(<ScenariosTable />);
      expect(screen.getByText("Current Conditions")).toBeInTheDocument();
    });

    it("renders one row per entry in data", () => {
      const rows: ScenarioSummaryRow[] = [
        makeRow({ scenario: "undisturbed", label: "Current" }),
        makeRow({ scenario: "thinning_40_75", label: "Scenario 1" }),
        makeRow({ scenario: "thinning_65_93", label: "Scenario 2" }),
      ];
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: rows,
        error: null,
      });
      render(<ScenariosTable />);
      expect(screen.getByText("Current")).toBeInTheDocument();
      expect(screen.getByText("Scenario 1")).toBeInTheDocument();
      expect(screen.getByText("Scenario 2")).toBeInTheDocument();
    });
  });

  describe("query configuration", () => {
    it("passes enabled: false when there is no runId", () => {
      mockUseParams.mockReturnValue(null);
      const capturedOpts: { enabled?: boolean } = {};
      mockUseQuery.mockImplementation((opts: { enabled?: boolean }) => {
        Object.assign(capturedOpts, opts);
        return {
          isLoading: false,
          isError: false,
          data: undefined,
          error: null,
        };
      });
      render(<ScenariosTable />);
      expect(capturedOpts.enabled).toBe(false);
    });

    it("passes enabled: true and the correct queryKey when runId is present", () => {
      const capturedOpts: { enabled?: boolean; queryKey?: unknown[] } = {};
      mockUseQuery.mockImplementation(
        (opts: { enabled?: boolean; queryKey?: unknown[] }) => {
          Object.assign(capturedOpts, opts);
          return {
            isLoading: false,
            isError: false,
            data: undefined,
            error: null,
          };
        },
      );
      render(<ScenariosTable />);
      expect(capturedOpts.enabled).toBe(true);
      expect(capturedOpts.queryKey).toEqual(["scenariosSummary", RUN_ID]);
    });
  });

  describe("download and copy actions", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [makeRow()],
        error: null,
      });
    });

    it("calls downloadCsv with correct filename when download button is clicked", () => {
      render(<ScenariosTable />);
      fireEvent.click(screen.getByRole("button", { name: /download as csv/i }));
      expect(mockDownloadCsv).toHaveBeenCalledOnce();
      const [filename] = mockDownloadCsv.mock.calls[0] as [
        string,
        ...unknown[],
      ];
      expect(filename).toMatch(/scenarios_summary\.csv$/);
    });

    it("calls copyCsv when copy button is clicked", () => {
      render(<ScenariosTable />);
      fireEvent.click(screen.getByRole("button", { name: /copy as csv/i }));
      expect(mockCopyCsv).toHaveBeenCalledOnce();
    });

    it("shows 'Copied!' label after copy button is clicked", async () => {
      render(<ScenariosTable />);
      fireEvent.click(screen.getByRole("button", { name: /copy as csv/i }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /copied!/i }),
        ).toBeInTheDocument(),
      );
    });
  });
});
