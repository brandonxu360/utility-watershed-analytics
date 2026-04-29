import { tss } from "../../utils/tss";
import { alpha } from "@mui/material/styles";

export const useStyles = tss.create(({ theme }) => ({
  root: {
    paddingBottom: theme.spacing(4),
  },
  contentBox: {
    marginTop: theme.spacing(2),
  },
  modelsBox: {
    marginTop: theme.spacing(3),
  },
  impactPaper: {
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.shape.borderRadius,
  },
  sectionHeading: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    fontSize: theme.typography.h6.fontSize,
  },
  sectionSubheading: {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: theme.spacing(1),
    color: alpha(theme.palette.primary.contrastText, 0.9),
  },
  sectionSubgroup: {
    padding: theme.spacing(1.25),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.2)}`,
    background: `linear-gradient(180deg, ${alpha(theme.palette.primary.contrastText, 0.1)} 0%, ${alpha(theme.palette.primary.contrastText, 0.04)} 100%)`,
  },
  sectionSubgroupControls: {
    marginBottom: theme.spacing(1.5),
  },
  sectionSubgroupLinks: {
    marginTop: theme.spacing(1.5),
  },
  sectionDivider: {
    borderColor: alpha(theme.palette.primary.contrastText, 0.5),
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
  emptyState: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.text.secondary,
    fontStyle: "italic",
  },
  title: {
    marginBottom: theme.spacing(1.5),
    fontSize: theme.typography.h2.fontSize,
  },
  titleMulti: {
    marginBottom: theme.spacing(1),
    fontSize: `calc((${theme.typography.h2.fontSize} + ${theme.typography.h3.fontSize}) / 2)`,
  },
  paragraph: {
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.h6.fontSize,
  },
  actionLink: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.accent.light,
    textAlign: "left",
    cursor: "pointer",
    display: "block",
    marginBottom: theme.spacing(1.5),
    textDecorationColor: theme.palette.accent.light,
  },
  skeletonClose: {
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  skeletonText: {
    marginBottom: theme.spacing(1),
  },
  skeletonParagraph: {
    marginBottom: theme.spacing(1.5),
  },
  skeletonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(4),
  },
  titleHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  reportDropdownWrapper: {
    marginBottom: theme.spacing(1.5),
  },
  reportDropdownHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "inherit",
    font: "inherit",
    appearance: "none",
    WebkitAppearance: "none",
    padding: theme.spacing(0.75, 1),
    border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.28)}`,
    borderRadius: theme.shape.borderRadius,
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.contrastText, 0.12),
    },
  },
  reportDropdownLabel: {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 600,
  },
  reportDropdownLinks: {
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(0.75),
  },
  linksHint: {
    fontSize: theme.typography.body2.fontSize,
    color: alpha(theme.palette.primary.contrastText, 0.82),
    marginBottom: theme.spacing(1),
  },
  // ── Shared layer row ────────────────────────────────────────────────────
  layer: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.5)} 0`,
  },
  layerTitle: {
    fontSize: theme.typography.body2.fontSize,
    flex: 1,
  },
  layerCheckbox: {
    color: theme.palette.primary.contrastText,
    "&.Mui-checked": {
      color: theme.palette.primary.contrastText,
    },
    "&.Mui-disabled": {
      color: theme.palette.muted.main,
      opacity: 0.85,
    },
  },
  layerDownloadButton: {
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.5),
    "&:hover": {
      color: theme.palette.primary.light,
    },
  },
  // ── Shared tooltip / scenario badge ────────────────────────────────────
  tooltipBubble: {
    backgroundColor: theme.palette.accent.main,
    color: theme.palette.common.white,
    fontSize: theme.typography.caption.fontSize,
  },
  tooltipArrow: {
    color: theme.palette.accent.main,
  },
  scenarioInfo: {
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.common.white,
    background: theme.palette.accent.main,
    borderRadius: "999px",
    padding: `${theme.spacing(0.25)} ${theme.spacing(1)}`,
    cursor: "help",
    userSelect: "none" as const,
    marginTop: theme.spacing(1),
  },
  // ── WeppControls ────────────────────────────────────────────────────────
  scenarioGroup: {
    marginBottom: theme.spacing(0.5),
  },
  scenarioSelect: {
    color: theme.palette.primary.contrastText,
    "& .MuiSelect-select": {
      fontSize: theme.typography.body2.fontSize,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.contrastText,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.contrastText,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.contrastText,
    },
    "& .MuiSvgIcon-root": {
      color: theme.palette.primary.contrastText,
    },
  },
  scenarioSelectPaper: {
    maxHeight: 200,
  },
  scenarioFormControl: {
    marginTop: theme.spacing(0.5),
  },
  scenarioLabel: {
    color: theme.palette.primary.contrastText,
    "&.Mui-focused": {
      color: theme.palette.primary.contrastText,
    },
  },
  variableRow: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.25)} 0`,
  },
  variableTitle: {
    fontSize: theme.typography.body2.fontSize,
    flex: 1,
    paddingLeft: theme.spacing(0.5),
  },
  variableHeading: {
    fontSize: theme.typography.body2.fontSize,
    flex: 1,
    paddingLeft: theme.spacing(0.5),
    fontWeight: 600,
  },
  radio: {
    color: theme.palette.primary.contrastText,
    "&.Mui-checked": {
      color: theme.palette.primary.contrastText,
    },
  },
  variableHeadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(0.5),
  },
  // ── RhessysSpatialControls + RhessysOutputsControls shared selects ──────
  rhessysSelect: {
    color: theme.palette.primary.contrastText,
    "& .MuiSelect-select": {
      fontSize: theme.typography.body2.fontSize,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.contrastText,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.contrastText,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.contrastText,
    },
    "& .MuiSvgIcon-root": {
      color: theme.palette.primary.contrastText,
    },
  },
  rhessysLabel: {
    color: theme.palette.primary.contrastText,
    "&.Mui-focused": {
      color: theme.palette.primary.contrastText,
    },
  },
  rhessysSpatialSelectPaper: {
    maxHeight: 300,
  },
  rhessysSpatialFormControl: {
    marginTop: theme.spacing(0.5),
  },
  rhessysOutputSelectPaper: {
    maxHeight: 200,
  },
  rhessysOutputFormControl: {
    marginTop: theme.spacing(1.5),
  },
  // ── RhessysOutputsControls ──────────────────────────────────────────────
  toggleGroup: {
    marginTop: theme.spacing(1),
    "& .MuiToggleButton-root": {
      color: theme.palette.primary.contrastText,
      borderColor: theme.palette.primary.contrastText,
      fontSize: theme.typography.caption.fontSize,
      padding: `${theme.spacing(0.25)} ${theme.spacing(1)}`,
      "&.Mui-selected": {
        backgroundColor: theme.palette.primary.contrastText,
        color: theme.palette.primary.main,
        "&:hover": {
          backgroundColor: theme.palette.primary.contrastText,
        },
      },
    },
  },
}));
