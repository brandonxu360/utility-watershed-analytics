import React, { useRef } from 'react';
import { tss } from "../../utils/tss";
import DragHandleIcon from '@mui/icons-material/DragHandle';

type BottomPanelProps = {
  isOpen: boolean;
  children: React.ReactNode;
}

const useStyles = tss.create(({ theme }) => ({
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '16px',
    maxHeight: '450px',
    background: theme.palette.background.default,
    color: theme.palette.primary.contrastText,
    borderTop: `0.5px solid ${theme.palette.primary.dark}`,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10000,
  },
  bottomPanelDrag: {
    height: '16px',
    cursor: 'ns-resize',
    background: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPanelContent: {
    padding: `${theme.spacing(3)} ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)}`,
    overflowY: 'auto',
    flex: 1,
  },
}));

export default function BottomPanel({ isOpen, children }: BottomPanelProps) {
  const { classes } = useStyles();

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
      panelRef.current.style.height = `${Math.max(16, Math.min(450, newHeight))}px`;
    }
  };

  const stopDrag = () => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  if (!isOpen) return null;

  return (
    <div className={classes.bottomPanel} ref={panelRef} data-testid="bottom-panel">
      <div className={classes.bottomPanelDrag} onMouseDown={handleDrag} data-testid="bottom-panel-drag">
        <DragHandleIcon data-testid="drag-handle-icon" />
      </div>
      <div className={classes.bottomPanelContent}>{children}</div>
    </div>
  );
}
