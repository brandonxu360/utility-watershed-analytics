import { useEffect, useState } from "react";

/** Simple check for viewport width < 768px. */
export function useIsSmallScreen(): boolean {
  const [isSmall, setIsSmall] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const onResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        setIsSmall(window.innerWidth < 768);
      }, 150);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return isSmall;
}
