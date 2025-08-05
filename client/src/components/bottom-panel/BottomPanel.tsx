import React, { useRef } from 'react';
import './BottomPanel.css';

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomPanel({ isOpen, children }: BottomPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startHeight = useRef<number>(0);

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    startHeight.current = panelRef.current?.offsetHeight || 0;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const onDrag = (e: MouseEvent) => {
    if (panelRef.current) {
      const newHeight = startHeight.current - (e.clientY - startY.current);
      panelRef.current.style.height = `${Math.max(60, Math.min(window.innerHeight - 100, newHeight))}px`;
    }
  };

  const stopDrag = () => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  if (!isOpen) return null;

  return (
    <div className="bottom-panel-overlay">
      <div className="bottom-panel" ref={panelRef}>
        <div className="bottom-panel-drag" onMouseDown={handleDrag} />
        <div className="bottom-panel-content">{children}</div>
      </div>
    </div>
  );
}
