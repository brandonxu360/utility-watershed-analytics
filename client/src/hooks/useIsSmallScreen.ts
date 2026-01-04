import { useEffect, useState } from 'react';

/** Simple check for viewport width < 768px. */
export function useIsSmallScreen(): boolean {
    const [isSmall, setIsSmall] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth < 768;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const onResize = () => setIsSmall(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return isSmall;
}
