import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScenariosTable } from "../components/bottom-panels/ScenariosTable";
import type { ScenarioSummaryRow } from "../api/scenarioApi";

const { mockUseQuery, mockUseParams } = vi.hoisted(() => ({
    mockUseQuery: vi.fn(),
    mockUseParams: vi.fn(),
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

function makeRow(overrides: Partial<ScenarioSummaryRow> = {}): ScenarioSummaryRow {
    return {
        scenario: "undisturbed",
        label: "Current",
        totalArea: 100,
        waterDischarge: 50,
        hillslopeSoilLoss: 200,
        channelSoilLoss: 150,
        sedimentDischarge: 300,
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
            mockUseQuery.mockReturnValue({ isLoading: true, isError: false, data: undefined, error: null });
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
            expect(screen.getByText(/failed to load scenario data/i)).toBeInTheDocument();
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
            mockUseQuery.mockReturnValue({ isLoading: false, isError: false, data: [], error: null });
            render(<ScenariosTable />);
            expect(screen.getByText(/no scenario data available/i)).toBeInTheDocument();
        });

        it("shows the empty-data message when data is undefined", () => {
            mockUseQuery.mockReturnValue({ isLoading: false, isError: false, data: undefined, error: null });
            render(<ScenariosTable />);
            expect(screen.getByText(/no scenario data available/i)).toBeInTheDocument();
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

        it("renders the 'Average Annual' title", () => {
            render(<ScenariosTable />);
            expect(screen.getByText("Average Annual")).toBeInTheDocument();
        });

        it("renders the Scenario column header", () => {
            render(<ScenariosTable />);
            expect(screen.getByRole("columnheader", { name: /scenario/i })).toBeInTheDocument();
        });

        it("renders the water-discharge header with mm units", () => {
            render(<ScenariosTable />);
            expect(
                screen.getByRole("columnheader", { name: /water discharge from outlet \(mm\)/i }),
            ).toBeInTheDocument();
        });

        it("renders the hillslope-soil-loss header with t/ha units", () => {
            render(<ScenariosTable />);
            expect(
                screen.getByRole("columnheader", { name: /hillslope soil loss \(t\/ha\)/i }),
            ).toBeInTheDocument();
        });

        it("renders the channel-soil-loss header with t/ha units", () => {
            render(<ScenariosTable />);
            expect(
                screen.getByRole("columnheader", { name: /channel soil loss \(t\/ha\)/i }),
            ).toBeInTheDocument();
        });

        it("renders the sediment-discharge header with t/ha units", () => {
            render(<ScenariosTable />);
            expect(
                screen.getByRole("columnheader", { name: /sediment discharge from outlet \(t\/ha\)/i }),
            ).toBeInTheDocument();
        });
    });

    describe("per-hectare (t/ha) calculation", () => {
        it("divides hillslopeSoilLoss by totalArea", () => {
            // 200 tonnes / 100 ha = 2 t/ha
            mockUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                data: [makeRow({ hillslopeSoilLoss: 200, totalArea: 100 })],
                error: null,
            });
            render(<ScenariosTable />);
            // The table uses aria-label="watershed scenarios" (data-testid="scenarios-table")
            const table = screen.getByTestId("scenarios-table");
            expect(table).toHaveTextContent("2");
        });

        it("divides channelSoilLoss by totalArea", () => {
            // 150 / 100 = 1.5 t/ha
            mockUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                data: [makeRow({ channelSoilLoss: 150, totalArea: 100 })],
                error: null,
            });
            render(<ScenariosTable />);
            const table = screen.getByTestId("scenarios-table");
            expect(table).toHaveTextContent("1.5");
        });

        it("divides sedimentDischarge by totalArea", () => {
            // 300 / 100 = 3 t/ha
            mockUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                data: [makeRow({ sedimentDischarge: 300, totalArea: 100 })],
                error: null,
            });
            render(<ScenariosTable />);
            const table = screen.getByTestId("scenarios-table");
            expect(table).toHaveTextContent("3");
        });

        it("renders '—' for hillslopeSoilLoss when totalArea is null", () => {
            mockUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                data: [makeRow({ hillslopeSoilLoss: 200, totalArea: null })],
                error: null,
            });
            render(<ScenariosTable />);
            const table = screen.getByTestId("scenarios-table");
            expect(table).toHaveTextContent("—");
        });

        it("renders '—' for hillslopeSoilLoss when totalArea is 0", () => {
            mockUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                data: [makeRow({ hillslopeSoilLoss: 200, totalArea: 0 })],
                error: null,
            });
            render(<ScenariosTable />);
            const table = screen.getByTestId("scenarios-table");
            expect(table).toHaveTextContent("—");
        });

        it("renders '—' for a TONNES_KEY when its value is null", () => {
            mockUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                data: [makeRow({ channelSoilLoss: null, totalArea: 100 })],
                error: null,
            });
            render(<ScenariosTable />);
            const table = screen.getByTestId("scenarios-table");
            expect(table).toHaveTextContent("—");
        });
    });

    describe("waterDischarge (non-tonnes) is displayed without area division", () => {
        it("renders the raw waterDischarge value", () => {
            mockUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                data: [makeRow({ waterDischarge: 123.45, totalArea: 10 })],
                error: null,
            });
            render(<ScenariosTable />);
            const table = screen.getByTestId("scenarios-table");
            // 123.45, not 123.45/10 = 12.345
            expect(table).toHaveTextContent("123.45");
        });

        it("renders '—' when waterDischarge is null", () => {
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

        it("uses exponential notation for very small values (< 0.01)", () => {
            // 0.0001 should use toExponential(3) → "1.000e-4"
            const table = renderWithRow({ waterDischarge: 0.0001 });
            expect(table).toHaveTextContent("1.000e-4");
        });

        it("uses exponential notation for very large values (>= 1e6)", () => {
            const table = renderWithRow({ waterDischarge: 1_500_000 });
            expect(table).toHaveTextContent("1.500e+6");
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
                return { isLoading: false, isError: false, data: undefined, error: null };
            });
            render(<ScenariosTable />);
            expect(capturedOpts.enabled).toBe(false);
        });

        it("passes enabled: true and the correct queryKey when runId is present", () => {
            const capturedOpts: { enabled?: boolean; queryKey?: unknown[] } = {};
            mockUseQuery.mockImplementation(
                (opts: { enabled?: boolean; queryKey?: unknown[] }) => {
                    Object.assign(capturedOpts, opts);
                    return { isLoading: false, isError: false, data: undefined, error: null };
                },
            );
            render(<ScenariosTable />);
            expect(capturedOpts.enabled).toBe(true);
            expect(capturedOpts.queryKey).toEqual(["scenariosSummary", RUN_ID]);
        });
    });
});
