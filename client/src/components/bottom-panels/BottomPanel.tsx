import React, { useRef, useState } from "react";
import { tss } from "../../utils/tss";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

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
    maxHeight: "450px",
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
    height: "24px",
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

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isExpanded) setIsExpanded(true);
    startY.current = e.clientY;
    startHeight.current = panelRef.current?.offsetHeight || 24;
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const onDrag = (e: MouseEvent) => {
    if (panelRef.current) {
      const newHeight = startHeight.current - (e.clientY - startY.current);
      panelRef.current.style.height = `${Math.max(24, Math.min(450, newHeight))}px`;
    }
  };

  const stopDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    if (panelRef.current && panelRef.current.offsetHeight <= 24) {
      setIsExpanded(false);
    }
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
          className={classes.notch}
          onClick={() => {
            if (panelRef.current) {
              panelRef.current.style.height = isExpanded ? "24px" : "";
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
      <div className={classes.bottomPanelContent}>{children}</div>
    </div>
  );
}
