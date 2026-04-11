import { tss } from "../../utils/tss";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import Paper from "@mui/material/Paper";
import SmallScreenNotice from "../SmallScreenNotice";

const useStyles = tss.create(({ theme }) => ({
  root: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 64px)",
    overflow: "hidden",
  },
  sidePanel: {
    width: "30%",
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    background: theme.palette.surface.overlay,
    color: theme.palette.text.primary,
  },
  sidePanelContent: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "10px 30px 0",
    boxSizing: "border-box",
  },
  mainContent: {
    flex: 1,
    overflowY: "auto",
    color: theme.palette.text.primary,
    background: theme.palette.surface.content,
    padding: "0 40px 50px 40px",
  },
}));

interface SidePanelLayoutProps {
  sidePanel: React.ReactNode;
  mainContent: React.ReactNode;
}

export default function SidePanelLayout({
  sidePanel,
  mainContent,
}: SidePanelLayoutProps) {
  const { classes } = useStyles();

  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className={classes.root}>
      <Paper elevation={3} square className={classes.sidePanel}>
        <div className={classes.sidePanelContent}>{sidePanel}</div>
      </Paper>
      <div className={classes.mainContent}>{mainContent}</div>
    </div>
  );
}
