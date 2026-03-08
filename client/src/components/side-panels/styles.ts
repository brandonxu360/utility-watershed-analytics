/**
 * Shared accordion styles used by side-panel sections
 * so accordion look-and-feel stays consistent
 * without duplicating style objects.
 */
import { tss } from "../../utils/tss";

export const useSidePanelAccordionStyles = tss.create(({ theme }) => ({
  accordionGroup: {
    marginTop: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
  },
  accordion: {
    backgroundColor: theme.palette.surface.accordion,
    "&::before": {
      display: "none",
    },
  },
  accordionSummary: {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  },
  accordionSummaryLabel: {
    fontWeight: theme.typography.fontWeightMedium,
  },
  accordionDetails: {
    padding: `${theme.spacing(0.5)} ${theme.spacing(2)} ${theme.spacing(1.5)}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.75),
  },
}));
