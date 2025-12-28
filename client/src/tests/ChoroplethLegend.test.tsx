import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useWatershedOverlayStore } from '../store/WatershedOverlayStore';
import ChoroplethLegend from '../components/map/controls/ChoroplethLegend/ChoroplethLegend';

vi.mock('../hooks/useChoropleth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../hooks/useChoropleth')>();
    return {
        ...actual,
        useChoropleth: vi.fn(() => ({
            choropleth: useWatershedOverlayStore.getState().choropleth,
            isLoading: useWatershedOverlayStore.getState().choroplethLoading,
            error: useWatershedOverlayStore.getState().choroplethError,
            getColor: () => null,
            getChoroplethStyle: () => null,
            isActive: useWatershedOverlayStore.getState().choropleth !== 'none',
            config: useWatershedOverlayStore.getState().choropleth !== 'none'
                ? actual.CHOROPLETH_CONFIG[useWatershedOverlayStore.getState().choropleth as keyof typeof actual.CHOROPLETH_CONFIG]
                : null,
        })),
    };
});

describe('ChoroplethLegend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useWatershedOverlayStore.getState().setChoropleth('none');
        useWatershedOverlayStore.getState().setChoroplethYear(null);
        useWatershedOverlayStore.getState().setChoroplethData(null, null);
        useWatershedOverlayStore.getState().setChoroplethLoading(false);
        useWatershedOverlayStore.getState().setChoroplethError(null);
    });

    it('renders nothing when choropleth is none', () => {
        const { container } = render(<ChoroplethLegend />);
        expect(container.firstChild).toBeNull();
    });

    it('renders legend when choropleth is active', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');

        render(<ChoroplethLegend />);

        expect(screen.getByText('Vegetation Cover')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');
        useWatershedOverlayStore.getState().setChoroplethLoading(true);

        render(<ChoroplethLegend />);

        expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('shows error state', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');
        useWatershedOverlayStore.getState().setChoroplethError('Test error');

        render(<ChoroplethLegend />);

        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('displays value range when data is loaded', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');
        useWatershedOverlayStore.getState().setChoroplethLoading(false);
        useWatershedOverlayStore.getState().setChoroplethError(null);
        useWatershedOverlayStore.getState().setChoroplethData(
            new Map([[1, 50]]),
            { min: 0, max: 100 }
        );

        render(<ChoroplethLegend />);

        expect(screen.getByText('0.000')).toBeInTheDocument();
        expect(screen.getByText('50.00')).toBeInTheDocument();
        expect(screen.getByText('100.0')).toBeInTheDocument();
    });

    it('displays unit from config', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');
        useWatershedOverlayStore.getState().setChoroplethLoading(false);
        useWatershedOverlayStore.getState().setChoroplethError(null);
        useWatershedOverlayStore.getState().setChoroplethData(
            new Map([[1, 50]]),
            { min: 0, max: 100 }
        );

        render(<ChoroplethLegend />);

        expect(screen.getByText('% cover')).toBeInTheDocument();
    });

    it('renders year selector', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');

        render(<ChoroplethLegend />);

        expect(screen.getByLabelText('Year:')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('changes year when selector changes', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');

        render(<ChoroplethLegend />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '2020' } });

        expect(useWatershedOverlayStore.getState().choroplethYear).toBe(2020);
    });

    it('sets year to null when "All Years" is selected', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');
        useWatershedOverlayStore.getState().setChoroplethYear(2020);

        render(<ChoroplethLegend />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'all' } });

        expect(useWatershedOverlayStore.getState().choroplethYear).toBeNull();
    });

    it('closes legend when close button is clicked', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');

        render(<ChoroplethLegend />);

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        expect(useWatershedOverlayStore.getState().choropleth).toBe('none');
        expect(useWatershedOverlayStore.getState().choroplethYear).toBeNull();
    });

    it('renders gradient element', () => {
        useWatershedOverlayStore.getState().setChoropleth('evapotranspiration');
        useWatershedOverlayStore.getState().setChoroplethLoading(false);
        useWatershedOverlayStore.getState().setChoroplethError(null);
        useWatershedOverlayStore.getState().setChoroplethData(
            new Map([[1, 50]]),
            { min: 0, max: 100 }
        );

        const { container } = render(<ChoroplethLegend />);

        const gradient = container.querySelector('.choropleth-legend-gradient');
        expect(gradient).toBeInTheDocument();
    });
});
