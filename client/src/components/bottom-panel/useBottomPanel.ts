import { useState, useCallback } from 'react';

type PanelContent = React.ReactNode | null;

export function useBottomPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<PanelContent>(null);

  const openPanel = useCallback((panelContent?: PanelContent) => {
    setContent(panelContent ?? null);
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setContent(null);
  }, []);

  const setPanelContent = useCallback((panelContent: PanelContent) => {
    setContent(panelContent);
  }, []);

  return {
    isOpen,
    content,
    openPanel,
    closePanel,
    setPanelContent,
  };
}
