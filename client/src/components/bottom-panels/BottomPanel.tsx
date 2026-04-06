import React, { useEffect, useRef, useState } from "react";
import { tss } from "../../utils/tss";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const MIN_HEIGHT_PX = 24;
const MAX_HEIGHT_PX = 450;

type BottomPanelProps = {
  isOpen: boolean;
  children: React.ReactNode;
};

const useStyles = tss.create(({ theme }) => ({
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: `${MAX_HEIGHT_PX}px`,
    background: theme.palette.background.default,
    color: theme.palette.primary.contrastText,
    borderTop: `0.5px solid ${theme.palette.primary.dark}`,
    boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 10000,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: theme.palette.primary.main,
  },
  notch: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: theme.palette.primary.contrastText,
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
    lineHeight: 0,
  },
  bottomPanelDrag: {
    flex: 1,
    height: `${MIN_HEIGHT_PX}px`,
    cursor: "ns-resize",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomPanelContent: {
    padding: `${theme.spacing(3)} ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)}`,
    overflowY: "auto",
    flex: 1,
  },
}));

export default function BottomPanel({ isOpen, children }: BottomPanelProps) {
  const { classes } = useStyles();
  const [isExpanded, setIsExpanded] = useState(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startHeight = useRef<number>(0);
  const dragHeight = useRef<number>(0);
  const activeDragHandlers = useRef<{
    onDrag: (e: MouseEvent) => void;
    stopDrag: () => void;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (activeDragHandlers.current) {
        document.removeEventListener(
          "mousemove",
          activeDragHandlers.current.onDrag,
        );
        document.removeEventListener(
          "mouseup",
          activeDragHandlers.current.stopDrag,
        );
      }
    };
  }, []);

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    // Clean up any in-progress drag before starting a new one
    // (guards against duplicate listeners from repeated mousedowns)
    if (activeDragHandlers.current) {
      document.removeEventListener("mousemove", activeDragHandlers.current.onDrag);
      document.removeEventListener("mouseup", activeDragHandlers.current.stopDrag);
      activeDragHandlers.current = null;
    }
    if (!isExpanded) setIsExpanded(true);
    startY.current = e.clientY;
    startHeight.current = panelRef.current?.offsetHeight || MIN_HEIGHT_PX;

    const onDrag = (ev: MouseEvent) => {
      if (panelRef.current) {
        const newHeight = Math.max(
          MIN_HEIGHT_PX,
          Math.min(
            MAX_HEIGHT_PX,
            startHeight.current - (ev.clientY - startY.current),
          ),
        );
        dragHeight.current = newHeight;
        panelRef.current.style.height = `${newHeight}px`;
      }
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", onDrag);
      document.removeEventListener("mouseup", stopDrag);
      activeDragHandlers.current = null;
      if (dragHeight.current <= MIN_HEIGHT_PX) {
        setIsExpanded(false);
      }
    };

    activeDragHandlers.current = { onDrag, stopDrag };
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  if (!isOpen) return null;

  return (
    <div
      className={classes.bottomPanel}
      ref={panelRef}
      data-testid="bottom-panel"
    >
      <div className={classes.topBar}>
        <div
          className={classes.bottomPanelDrag}
          onMouseDown={handleDrag}
          data-testid="bottom-panel-drag"
        >
          <DragHandleIcon data-testid="drag-handle-icon" />
        </div>
        <button
          type="button"
          className={classes.notch}
          onClick={() => {
            if (panelRef.current) {
              panelRef.current.style.height = isExpanded
                ? `${MIN_HEIGHT_PX}px`
                : "";
            }
            setIsExpanded((prev) => !prev);
          }}
          data-testid="bottom-panel-toggle"
          aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
        >
          {isExpanded ? (
            <KeyboardArrowDownIcon
              fontSize="small"
              data-testid="chevron-down-icon"
            />
          ) : (
            <KeyboardArrowUpIcon
              fontSize="small"
              data-testid="chevron-up-icon"
            />
          )}
        </button>
      </div>
      <div
        className={classes.bottomPanelContent}
        hidden={!isExpanded}
        aria-hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
}
