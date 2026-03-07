import { useSidePanelAccordionStyles } from "./styles";
import { tss } from "../../utils/tss";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WeppSection from "./sections/WeppSection";
import WatershedDataSection from "./sections/WatershedDataSection";
import RhessysSection from "./sections/RhessysSection";
import { useRhessysSpatialInputs } from "../../hooks/useRhessysSpatialInputs";
import { useParams } from "@tanstack/react-router";

const useStyles = tss.create(({ theme }) => ({
  root: {
    marginTop: theme.spacing(2),
  },
  heading: {
    marginBottom: theme.spacing(1),
  },
  accordionDetailsCompact: {
    padding: `0 ${theme.spacing(2)} ${theme.spacing(1.5)}`,
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
}));

export default function DataLayers() {
  const { classes } = useStyles();
  const { classes: accordionClasses } = useSidePanelAccordionStyles();

  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;

  const { files, isLoading } = useRhessysSpatialInputs(runId);

  return (
    <div className={classes.root} data-testid="data-layers-side-panel">
      <div className={classes.heading}>
        <Typography variant="body1">
          <strong>Watershed Models & Data</strong>
        </Typography>
      </div>

      <div className={accordionClasses.accordionGroup}>
        {/* WEPP */}
        <Accordion className={accordionClasses.accordion} disableGutters>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="wepp-layers-content"
            id="wepp-layers-header"
            className={accordionClasses.accordionSummary}
          >
            <Typography
              component="span"
              variant="body2"
              className={accordionClasses.accordionSummaryLabel}
            >
              WEPP
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordionDetailsCompact}>
            <WeppSection />
          </AccordionDetails>
        </Accordion>

        {/* RHESSys */}
        <Accordion className={accordionClasses.accordion} disableGutters>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="rhessys-layers-content"
            id="rhessys-layers-header"
            className={accordionClasses.accordionSummary}
          >
            <Typography
              component="span"
              variant="body2"
              className={accordionClasses.accordionSummaryLabel}
            >
              RHESSys
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordionDetailsCompact}>
            <RhessysSection
              files={files}
              isLoading={isLoading}
            />
          </AccordionDetails>
        </Accordion>

        {/* Watershed Data */}
        <Accordion className={accordionClasses.accordion} disableGutters>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="watershed-data-layers-content"
            id="watershed-data-layers-header"
            className={accordionClasses.accordionSummary}
          >
            <Typography
              component="span"
              variant="body2"
              className={accordionClasses.accordionSummaryLabel}
            >
              Watershed Data
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordionDetailsCompact}>
            <WatershedDataSection />
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  );
}
