import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useIsSmallScreen } from '../hooks/useIsSmallScreen';

function TestComp() {
    const isSmall = useIsSmallScreen();
    return <div data-testid="flag">{isSmall ? 'small' : 'large'}</div>;
}

describe('useIsSmallScreen', () => {
    afterEach(() => cleanup());

    it('returns true when width < 768', () => {
        (window as any).innerWidth = 500;
        render(<TestComp />);
        expect(screen.getByTestId('flag').textContent).toBe('small');
    });

    it('returns false when width >= 768', () => {
        (window as any).innerWidth = 1024;
        render(<TestComp />);
        expect(screen.getByTestId('flag').textContent).toBe('large');
    });

    it('updates on resize events', () => {
        (window as any).innerWidth = 500;
        render(<TestComp />);
        expect(screen.getByTestId('flag').textContent).toBe('small');

        (window as any).innerWidth = 900;
        fireEvent(window, new Event('resize'));
        expect(screen.getByTestId('flag').textContent).toBe('large');

        (window as any).innerWidth = 600;
        fireEvent(window, new Event('resize'));
        expect(screen.getByTestId('flag').textContent).toBe('small');
    });
});
