import React, { createContext, useContext } from 'react';
import { useBottomPanel } from './useBottomPanel';

const BottomPanelContext = createContext<ReturnType<typeof useBottomPanel> | null>(null);

export function BottomPanelProvider({ children }: { children: React.ReactNode }) {
  const bottomPanel = useBottomPanel();
  return (
    <BottomPanelContext.Provider value={bottomPanel}>
      {children}
    </BottomPanelContext.Provider>
  );
}

export function useBottomPanelContext() {
  const ctx = useContext(BottomPanelContext);
  if (!ctx) throw new Error('useBottomPanelContext must be used within BottomPanelProvider');
  return ctx;
}
