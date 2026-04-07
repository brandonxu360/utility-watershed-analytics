import React from "react";
import { tss } from "../utils/tss";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import SmallScreenNotice from "../components/SmallScreenNotice";
import RogerLew from "../assets/images/roger_lew.png";
import MarianaDobre from "../assets/images/mariana_dobre.png";
import ErinBrooks from "../assets/images/erin_brooks.png";
import SubhankarDas from "../assets/images/subhankar_das.jpeg";
import ErinHanan from "../assets/images/erin_hanan.jpg";
import WilliamBurke from "../assets/images/william_burke.png";
import LawrenceAlawode from "../assets/images/lawrence_alawode.png";
import MingliangLiu from "../assets/images/mingliang_liu.png";
import JuliePadowski from "../assets/images/julie_padowski.png";
import JennyAdam from "../assets/images/jenny_adam.png";
import KevinBladon from "../assets/images/kevin_bladon.png";
import RyanCole from "../assets/images/ryan_cole.png";
import PeteRobichaud from "../assets/images/pete_robichaud.png";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";

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
  mainContent: {
    flex: 1,
    overflowY: "auto",
    color: theme.palette.text.primary,
    background:
      theme.palette.mode === "light"
        ? theme.palette.surface.main
        : theme.palette.background.default,
    padding: "0 40px 50px 40px",
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
  memberCard: {
    display: "inline-block",
    padding: 10,
    margin: 10,
    width: 200,
    verticalAlign: "top",
    textAlign: "left",
  },
  memberImage: {
    display: "block",
    height: 190,
    width: "100%",
    objectFit: "cover" as const,
    objectPosition: "center",
  },
  memberName: {
    fontWeight: 800,
    paddingTop: 10,
    marginBottom: 10,
  },
  memberLink: {
    color: theme.palette.accent.main,
    fontWeight: 800,
    textDecoration: "none",
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

const scrollToUniversity = (e: React.MouseEvent, id: string) => {
  e.preventDefault();
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

interface TeamMember {
  name: string;
  img: string;
  role: string;
  web: string;
}

interface UniversityGroup {
  name: string;
  members: TeamMember[];
}

const groupedMembers: UniversityGroup[] = [
  {
    name: "Washington State University",
    members: [
      {
        name: "Mingliang Liu",
        img: MingliangLiu,
        role: "Assistant Research Professor, Civil & Environmental Engineering",
        web: "https://ce.wsu.edu/faculty/liu-mingliang/",
      },
      {
        name: "Julie Padowski",
        img: JuliePadowski,
        role: "Research Associate Professor, School of the Environment",
        web: "https://environment.wsu.edu/faculty/wsu-profile/julie.padowski/",
      },
      {
        name: "Jenny Adam",
        img: JennyAdam,
        role: "Professor, Civil & Environmental Engineering",
        web: "https://ce.wsu.edu/faculty/adam/",
      },
    ],
  },
  {
    name: "University of Idaho",
    members: [
      {
        name: "Roger Lew",
        img: RogerLew,
        role: "Research Associate Professor, Virtual Technology and Design",
        web: "https://www.uidaho.edu/people/rogerlew",
      },
      {
        name: "Mariana Dobre",
        img: MarianaDobre,
        role: "Assistant Professor, Soil and Water Systems",
        web: "https://www.uidaho.edu/people/mdobre",
      },
      {
        name: "Erin Brooks",
        img: ErinBrooks,
        role: "Professor, Soil and Water Systems",
        web: "https://www.uidaho.edu/people/ebrooks",
      },
      {
        name: "Subhankar Das",
        img: SubhankarDas,
        role: "Postdoctoral Fellow, Soil and Water Systems",
        web: "https://scholar.google.com/citations?user=K2ZoamkAAAAJ&hl=en",
      },
    ],
  },
  {
    name: "University of Nevada, Reno",
    members: [
      {
        name: "Erin Hanan",
        img: ErinHanan,
        role: "Associate Professor, Fire & Ecosystem Ecology",
        web: "https://www.unr.edu/nres/people/hanan-erin",
      },
      {
        name: "William Burke",
        img: WilliamBurke,
        role: "Ecohydrologic Researcher",
        web: "https://www.wdburke.com/",
      },
      {
        name: "Lawrence Alawode",
        img: LawrenceAlawode,
        role: "Doctoral Student, Hydrologic Sciences",
        web: "https://www.unr.edu/hydrologic-sciences/people/students/lawrence-gbenga-alawode",
      },
    ],
  },
  {
    name: "Oregon State University",
    members: [
      {
        name: "Kevin Bladon",
        img: KevinBladon,
        role: "Faculty, Forest Ecosystems & Society",
        web: "https://directory.forestry.oregonstate.edu/people/bladon-kevin",
      },
      {
        name: "Ryan Cole",
        img: RyanCole,
        role: "Faculty Research Assistant, Wildfire and Water Security",
        web: "https://www.researchgate.net/profile/Ryan-Cole-9",
      },
    ],
  },
  {
    name: "US Forest Service, Rocky Mtn Research Station",
    members: [
      {
        name: "Pete Robichaud",
        img: PeteRobichaud,
        role: "Research Engineer, Erosion Modeling and Mitigation, Wildfires",
        web: "https://scholar.google.com/citations?user=wy3ols4AAAAJ&hl=en",
      },
    ],
  },
];

const MemberCard = ({ person }: { person: TeamMember }) => {
  const { classes } = useStyles();
  return (
    <div className={classes.memberCard}>
      <img src={person.img} alt={person.name} className={classes.memberImage} />
      <Typography
        component="p"
        variant="subtitle2"
        className={classes.memberName}
      >
        <a
          href={person.web}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.memberLink}
        >
          {person.name}
        </a>
      </Typography>
      <Typography variant="body2">{person.role}</Typography>
    </div>
  );
};

const SidePanel = () => {
  const { classes } = useStyles();
  return (
    <Paper elevation={3} square className={classes.sidePanel}>
      <div className={classes.sidePanelContent}>
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
            onClick={(e) =>
              scrollToUniversity(e, "Washington_State_University")
            }
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
            onClick={(e) => scrollToUniversity(e, "University_of_Nevada,_Reno")}
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
                "US_Forest_Service,_Rocky_Mtn_Research_Station",
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
      </div>
    </Paper>
  );
};

const Content = () => {
  const { classes } = useStyles();
  return (
    <div className={classes.mainContent}>
      <div className={classes.universitySections}>
        {groupedMembers.map(({ name: university, members }) => (
          <section
            key={university}
            id={university.replace(/\s+/g, "_")}
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
    </div>
  );
};

/**
 * Layout for the TEAM page.
 */
export default function Team() {
  const { classes } = useStyles();
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className={classes.root}>
      <SidePanel />
      <Content />
    </div>
  );
}
