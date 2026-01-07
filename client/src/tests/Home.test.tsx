import { render, screen, cleanup } from '@testing-library/react';
import { RouterProvider } from '@tanstack/react-router';
import { describe, expect, it, afterEach } from 'vitest';
import { router } from '../routes/router';

describe('Home small-screen behavior', () => {
    afterEach(() => cleanup());

    it('shows the small-screen notice when width < 768px', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).innerWidth = 500;
        render(<RouterProvider router={router} />);
        expect(screen.getByText(/Best viewed on larger screens/i)).toBeInTheDocument();
    });
});
