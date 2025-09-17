import { useBottomPanel, BottomPanelContext } from '../bottom-panel/BottomPanelContext';

export function BottomPanelProvider({ children }: { children: React.ReactNode }) {
  const bottomPanel = useBottomPanel();
  return (
    <BottomPanelContext.Provider value={bottomPanel}>
      {children}
    </BottomPanelContext.Provider>
  );
}
