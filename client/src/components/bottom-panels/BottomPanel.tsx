import React, { useRef } from 'react';
import { tss } from "tss-react";
import { useTheme } from '@mui/material/styles';
import type { ThemeMode } from '../../utils/theme';
import Box from "@mui/material/Box";
import DragHandleIcon from '@mui/icons-material/DragHandle';

type BottomPanelProps = {
  isOpen: boolean;
  children: React.ReactNode;
}

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '16px',
    maxHeight: '450px',
    background: '#222',
    color: mode.colors.primary100,
    borderTop: `0.5px solid ${mode.colors.primary500}`,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10000,
  },
  bottomPanelDrag: {
    height: '16px',
    cursor: 'ns-resize',
    background: '#444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPanelContent: {
    padding: '24px 16px 16px 16px',
    overflowY: 'auto',
    flex: 1,
  },
}));

export default function BottomPanel({ isOpen, children }: BottomPanelProps) {
  const theme = useTheme();
  const mode = (theme as { mode: ThemeMode }).mode;

  const { classes } = useStyles({ mode });

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
    <Box className={classes.bottomPanel} ref={panelRef}>
      <Box className={classes.bottomPanelDrag} onMouseDown={handleDrag}>
        <DragHandleIcon />
      </Box>
      <Box className={classes.bottomPanelContent}>{children}</Box>
    </Box>
  );
}
