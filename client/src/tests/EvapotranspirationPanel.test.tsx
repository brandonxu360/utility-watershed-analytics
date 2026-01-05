import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { EvapotranspirationPanel } from "../components/bottom-panels/EvapotranspirationPanel";
import { Properties } from "../types/WatershedFeature";
import { useAppStore } from "../store/store";

const { mockFetchRapChoropleth } = vi.hoisted(() => ({
    mockFetchRapChoropleth: vi.fn().mockImplementation(() =>
        Promise.resolve([
            { wepp_id: 1, value: 15.5 },
            { wepp_id: 2, value: 18.2 },
            { wepp_id: 3, value: 12.8 },
        ])
    ),
}));

vi.mock("../api/rapApi", () => ({
    default: vi.fn(),
    fetchRap: vi.fn(),
    fetchRapChoropleth: mockFetchRapChoropleth,
}));

const mockClosePanel = vi.fn();
const mockClearSelectedHillslope = vi.fn();
const mockSetSubcatchment = vi.fn();
const mockSetChoroplethYear = vi.fn();
const mockResetChoropleth = vi.fn();

beforeEach(() => {
    mockClosePanel.mockClear();
    mockClearSelectedHillslope.mockClear();
    mockSetSubcatchment.mockClear();
    mockSetChoroplethYear.mockClear();
    mockResetChoropleth.mockClear();
    mockFetchRapChoropleth.mockClear();

    useAppStore.setState({
        closePanel: mockClosePanel,
        clearSelectedHillslope: mockClearSelectedHillslope,
        setSubcatchment: mockSetSubcatchment,
        setChoroplethYear: mockSetChoroplethYear,
        resetChoropleth: mockResetChoropleth,
        selectedHillslopeId: null,
        selectedHillslopeProps: null,
        choropleth: {
            type: 'evapotranspiration',
            year: null,
            bands: 'all',
            data: null,
            range: { min: 10, max: 25 },
            loading: false,
            error: null,
        },
    });
});

afterEach(async () => {
    await act(async () => {
        useAppStore.setState({
            selectedHillslopeId: null,
            selectedHillslopeProps: null,
        });
    });
});

describe("EvapotranspirationPanel", () => {
    it("renders the panel title and year selector", async () => {
        await act(async () => {
            render(<EvapotranspirationPanel />);
        });

        expect(screen.getByText("Evapotranspiration")).toBeInTheDocument();
        expect(screen.getByLabelText("Select Year:")).toBeInTheDocument();
    });

    it("shows loading state while fetching data", async () => {
        mockFetchRapChoropleth.mockImplementation(() =>
            new Promise((resolve) => setTimeout(() => resolve([{ wepp_id: 1, value: 15 }]), 100))
        );

        await act(async () => {
            render(<EvapotranspirationPanel />);
        });

        expect(screen.getByText("Loading evapotranspiration data…")).toBeInTheDocument();
    });

    it("renders chart with default title when no hillslope selected", async () => {
        // Using a specific year to avoid the slow "All years" sequential fetch
        await act(async () => {
            useAppStore.setState({
                choropleth: {
                    type: 'evapotranspiration',
                    year: 2020,
                    bands: 'all',
                    data: null,
                    range: { min: 10, max: 25 },
                    loading: false,
                    error: null,
                },
            });
        });

        await act(async () => {
            render(<EvapotranspirationPanel />);
        });

        await waitFor(() => {
            expect(screen.getByTestId("coverage-chart")).toBeInTheDocument();
        });

        const chart = screen.getByTestId("coverage-chart");
        expect(chart).toHaveTextContent("Evapotranspiration (2020)");
    });

    it("shows hillslope ID in chart title when hillslope is selected", async () => {
        await act(async () => {
            useAppStore.setState({
                selectedHillslopeId: 123,
                selectedHillslopeProps: { cancov: 20, inrcov: 10, dom: 5, width_m: 12 } as Properties,
                choropleth: {
                    type: 'evapotranspiration',
                    year: 2020,
                    bands: 'all',
                    data: null,
                    range: { min: 10, max: 25 },
                    loading: false,
                    error: null,
                },
            });
        });

        await act(async () => {
            render(<EvapotranspirationPanel />);
        });

        await waitFor(() => {
            expect(screen.getByTestId("coverage-chart")).toBeInTheDocument();
        });

        const chart = screen.getByTestId("coverage-chart");
        expect(chart).toHaveTextContent("Evapotranspiration - Hillslope 123 (2020)");
    });

    it("calls closePanel and reset functions when close button is clicked", async () => {
        let container: HTMLElement;
        await act(async () => {
            const result = render(<EvapotranspirationPanel />);
            container = result.container;
        });

        await act(async () => {
            await waitFor(() => {
                expect(mockFetchRapChoropleth).toHaveBeenCalled();
            });
        });

        const closeEl = container!.querySelector(".vegCloseButton");
        expect(closeEl).toBeTruthy();

        await act(async () => {
            if (closeEl) {
                fireEvent.click(closeEl);
            }
        });

        expect(mockClearSelectedHillslope).toHaveBeenCalled();
        expect(mockSetSubcatchment).toHaveBeenCalledWith(false);
        expect(mockResetChoropleth).toHaveBeenCalled();
        expect(mockClosePanel).toHaveBeenCalled();
    });

    it("updates year selection and calls setChoroplethYear", async () => {
        await act(async () => {
            render(<EvapotranspirationPanel />);
        });

        await act(async () => {
            await waitFor(() => {
                expect(mockFetchRapChoropleth).toHaveBeenCalled();
            });
        });

        await act(async () => {
            const selectButton = screen.getByTestId("select-et-year");
            fireEvent.click(selectButton);
        });

        await act(async () => {
            const yearOption = screen.getByRole("option", { name: "2020" });
            fireEvent.click(yearOption);
        });

        expect(mockSetChoroplethYear).toHaveBeenCalledWith(2020);

        await waitFor(() => {
            const chart = screen.getByTestId("coverage-chart");
            expect(chart).toHaveTextContent("Evapotranspiration (2020)");
        });
    });

    it("displays error message when data fetch fails", async () => {
        mockFetchRapChoropleth.mockImplementation(() =>
            Promise.reject(new Error("Network error"))
        );

        await act(async () => {
            render(<EvapotranspirationPanel />);
        });

        await waitFor(() => {
            expect(screen.getByText("Network error")).toBeInTheDocument();
        });
    });

    it("renders choropleth scale when range data is available", async () => {
        await act(async () => {
            render(<EvapotranspirationPanel />);
        });

        await act(async () => {
            await waitFor(() => {
                expect(mockFetchRapChoropleth).toHaveBeenCalled();
            });
        });

        const legend = document.querySelector(".choropleth-panel-legend");
        expect(legend).toBeInTheDocument();
    });

    it("fetches data for a single year when year is selected", async () => {
        await act(async () => {
            useAppStore.setState({
                choropleth: {
                    type: 'evapotranspiration',
                    year: 2015,
                    bands: 'all',
                    data: null,
                    range: { min: 10, max: 25 },
                    loading: false,
                    error: null,
                },
            });
        });

        await act(async () => {
            render(<EvapotranspirationPanel />);
        });

        await act(async () => {
            await waitFor(() => {
                expect(mockFetchRapChoropleth).toHaveBeenCalled();
            });
        });

        expect(mockFetchRapChoropleth).toHaveBeenCalledWith(
            expect.objectContaining({
                year: 2015,
            })
        );
    });
});
