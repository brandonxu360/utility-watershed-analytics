import { tss } from "../utils/tss";
import { MouseEvent } from "react";
import Typography from "@mui/material/Typography";
import MemberCard from "../components/MemberCard";
import { groupedMembers } from "../data/team";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import SidePanelLayout from "../components/side-panels/SidePanelLayout";

const useStyles = tss.create(({ theme }) => ({
  navButtons: {
    display: "flex",
    flexDirection: "column",
    marginTop: 16,
  },
  navButton: {
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${theme.palette.text.primary}`,
    borderRadius: 0,
    color: theme.palette.text.primary,
    fontSize: "1.1rem",
    justifyContent: "flex-start",
    padding: "8px 16px",
    textTransform: "none",
    width: "100%",
    "&:hover": {
      background: theme.palette.action.hover,
      borderBottom: `1px solid ${theme.palette.accent.main}`,
      color: theme.palette.accent.main,
    },
  },
  universitySections: {
    textAlign: "center",
  },
  universitySection: {
    scrollMarginTop: 60,
    paddingTop: 20,
  },
  univHeading: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    fontWeight: "bold",
    fontSize: "2rem",
    textAlign: "center",
  },
  partnerSection: {
    padding: "40px 40px 0 40px",
    scrollMarginTop: 60,
  },
  partnerLink: {
    color: theme.palette.accent.main,
    fontWeight: 800,
    fontSize: "1.2rem",
  },
}));

const scrollToUniversity = (e: MouseEvent, id: string) => {
  e.preventDefault();
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const SidePanel = () => {
  const { classes } = useStyles();
  return (
    <>
      <Typography variant="h2" fontWeight={"bold"} marginY={2}>
        Project Team & Partners
      </Typography>
      <Typography variant="body1">
        Select from the following to see our team of experts and partner
        institutions:
      </Typography>
      <div className={classes.navButtons}>
        <Button
          className={classes.navButton}
          onClick={(e) => scrollToUniversity(e, "Washington_State_University")}
        >
          Washington State University
        </Button>
        <Button
          className={classes.navButton}
          onClick={(e) => scrollToUniversity(e, "University_of_Idaho")}
        >
          University of Idaho
        </Button>
        <Button
          className={classes.navButton}
          onClick={(e) => scrollToUniversity(e, "University_of_Nevada_Reno")}
        >
          University of Nevada, Reno
        </Button>
        <Button
          className={classes.navButton}
          onClick={(e) => scrollToUniversity(e, "Oregon_State_University")}
        >
          Oregon State University
        </Button>
        <Button
          className={classes.navButton}
          onClick={(e) =>
            scrollToUniversity(
              e,
              "US_Forest_Service_Rocky_Mtn_Research_Station",
            )
          }
        >
          US Forest Service
        </Button>
        <Button
          className={classes.navButton}
          onClick={(e) => scrollToUniversity(e, "partner_section")}
        >
          Partners
        </Button>
      </div>
    </>
  );
};

const Content = () => {
  const { classes } = useStyles();
  return (
    <>
      <div className={classes.universitySections}>
        {groupedMembers.map(({ name: university, members }) => (
          <section
            key={university}
            id={university.replace(/[^a-zA-Z0-9]+/g, "_")}
            className={classes.universitySection}
          >
            <Typography component="h2" className={classes.univHeading}>
              {university}
            </Typography>
            {members.map((person) => (
              <MemberCard key={person.name} person={person} />
            ))}
          </section>
        ))}
      </div>

      <div id="partner_section" className={classes.partnerSection}>
        <Typography component="h2" variant="h5" className={classes.univHeading}>
          Partner Institutions
        </Typography>
        <Typography variant="body1">
          Pacific Northwest water utilities:
        </Typography>
        <Stack spacing={2} marginTop={1}>
          <Link
            href="https://www.seattle.gov/utilities"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            Seattle Public Utilities
          </Link>
          <Link
            href="https://www.portland.gov/water"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            Portland Water Bureau
          </Link>
          <Link
            href="https://www.eweb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            Eugene Water &amp; Electric Board
          </Link>
          <Link
            href="https://www.cityofsalem.net/community/household/water-utilities"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            City of Salem
          </Link>
          <Link
            href="https://www.bremertonwa.gov/524/Utility-Billing"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            City of Bremerton
          </Link>
          <Link
            href="https://www.medfordwater.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            Medford Water Commission
          </Link>
          <Link
            href="https://www.clackamasproviders.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            Clackamas River Water Providers
          </Link>
          <Link
            href="https://www.victoria.ca/home-property/utilities/water-system"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            City of Victoria, Canada
          </Link>
          <Link
            href="https://doh.wa.gov/community-and-environment/drinking-water/office-drinking-water"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            Washington Department of Health – Office of Drinking Water
          </Link>
          <Link
            href="https://www.waterrf.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={classes.partnerLink}
          >
            The Water Research Foundation
          </Link>
        </Stack>
      </div>
    </>
  );
};

/**
 * Layout for the TEAM page.
 */
export default function Team() {
  return (
    <SidePanelLayout sidePanel={<SidePanel />} mainContent={<Content />} />
  );
}
