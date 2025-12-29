import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useWatershedOverlayStore } from '../store/WatershedOverlayStore';
import ChoroplethLegend from '../components/map/controls/ChoroplethLegend/ChoroplethLegend';

vi.mock('../hooks/useChoropleth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../hooks/useChoropleth')>();
    return {
        ...actual,
        useChoropleth: vi.fn(() => {
            const state = useWatershedOverlayStore.getState();
            const choroplethType = state.choropleth.type;
            return {
                choropleth: choroplethType,
                isLoading: state.choropleth.loading,
                error: state.choropleth.error,
                getColor: () => null,
                getChoroplethStyle: () => null,
                isActive: choroplethType !== 'none',
                config: choroplethType !== 'none'
                    ? actual.CHOROPLETH_CONFIG[choroplethType as keyof typeof actual.CHOROPLETH_CONFIG]
                    : null,
            };
        }),
    };
});

describe('ChoroplethLegend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useWatershedOverlayStore.getState().setChoroplethType('none');
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
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');

        render(<ChoroplethLegend />);

        expect(screen.getByText('Vegetation Cover')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');
        useWatershedOverlayStore.getState().setChoroplethLoading(true);

        render(<ChoroplethLegend />);

        expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('shows error state', () => {
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');
        useWatershedOverlayStore.getState().setChoroplethError('Test error');

        render(<ChoroplethLegend />);

        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('displays value range when data is loaded', () => {
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');
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
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');
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
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');

        render(<ChoroplethLegend />);

        expect(screen.getByLabelText('Year:')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('changes year when selector changes', () => {
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');

        render(<ChoroplethLegend />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '2020' } });

        expect(useWatershedOverlayStore.getState().choropleth.year).toBe(2020);
    });

    it('sets year to null when "All Years" is selected', () => {
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');
        useWatershedOverlayStore.getState().setChoroplethYear(2020);

        render(<ChoroplethLegend />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'all' } });

        expect(useWatershedOverlayStore.getState().choropleth.year).toBeNull();
    });

    it('closes legend when close button is clicked', () => {
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');

        render(<ChoroplethLegend />);

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        expect(useWatershedOverlayStore.getState().choropleth.type).toBe('none');
        expect(useWatershedOverlayStore.getState().choropleth.year).toBeNull();
    });

    it('renders gradient element', () => {
        useWatershedOverlayStore.getState().setChoroplethType('vegetationCover');
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
