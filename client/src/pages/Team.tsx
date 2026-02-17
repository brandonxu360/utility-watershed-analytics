import React from "react";
import { tss } from "../utils/tss";
import { commonStyles, navStyles } from "../utils/sharedStyles";
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

const useStyles = tss.create({
  ...commonStyles,
  ...navStyles,
  univHeading: {
    borderBottom: "1px solid #ccc",
    paddingBottom: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    fontWeight: "bold",
    fontSize: "1.5rem",
    textAlign: "center",
  },
  memberCard: {
    display: "inline-block",
    padding: 10,
    margin: 10,
    width: 200,
    verticalAlign: "top",
    "& h4": {
      paddingTop: 10,
      marginBottom: "10px !important",
    },
    "& a": {
      fontWeight: 800,
      color: "#a3a8fa",
    },
    "& img": {
      height: 190,
      width: "100%",
      objectFit: "cover",
      objectPosition: "center",
    },
  },
  partnerSection: {
    display: "block",
    padding: "40px 40px 0 40px",
    textAlign: "left",
  },
});

const scrollToUniversity = (e: React.MouseEvent, name: string) => {
  e.preventDefault();
  const id = name.replace(/\s+/g, "_");
  const element = document.getElementById(id);

  if (element) {
    let scrollContainer = element.parentElement;
    while (scrollContainer) {
      const hasOverflow = window.getComputedStyle(scrollContainer).overflow;
      if (
        hasOverflow === "auto" ||
        hasOverflow === "scroll" ||
        scrollContainer.scrollHeight > scrollContainer.clientHeight
      ) {
        break;
      }
      scrollContainer = scrollContainer.parentElement;
    }

    if (scrollContainer) {
      const navbarHeight = 60;
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop =
        elementRect.top - containerRect.top + scrollContainer.scrollTop;
      const offsetPosition = relativeTop - navbarHeight;

      scrollContainer.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }
};

/* TEAM: SIDE PANEL CONTENT */
export function TeamSidePanelContent() {
  const { classes } = useStyles();
  return (
    <div className="about-panel">
      <h2>Project Team & Partners</h2>
      <p>
        Select from the following to see our team of experts and partner
        institutions:
      </p>

      <div className={classes.navButtons}>
        <button
          className={classes.actionButton}
          aria-label="Washington State University"
          title="Washington State University"
          id="wsu"
          onClick={(e) => scrollToUniversity(e, "Washington_State_University")}
        >
          Washington State University
        </button>

        <button
          className={classes.actionButton}
          aria-label="University of Idaho"
          title="University of Idaho"
          id="ui"
          onClick={(e) => scrollToUniversity(e, "University_of_Idaho")}
        >
          University of Idaho
        </button>

        <button
          className={classes.actionButton}
          aria-label="University of Nevada, Reno"
          title="University of Nevada, Reno"
          id="unr"
          onClick={(e) => scrollToUniversity(e, "University_of_Nevada,_Reno")}
        >
          University of Nevada, Reno
        </button>

        <button
          className={classes.actionButton}
          aria-label="Oregon State University"
          title="Oregon State University"
          id="osu"
          onClick={(e) => scrollToUniversity(e, "Oregon_State_University")}
        >
          Oregon State University
        </button>

        <button
          className={classes.actionButton}
          aria-label="US Forest Service"
          title="US Forest Service"
          id="usfs"
          onClick={(e) =>
            scrollToUniversity(
              e,
              "US_Forest_Service,_Rocky_Mtn_Research_Station",
            )
          }
        >
          US Forest Service
        </button>

        <button
          className={classes.actionButton}
          aria-label="Partners"
          title="Partners"
          id="partners"
          onClick={(e) => scrollToUniversity(e, "partner_section")}
        >
          Partners
        </button>
      </div>
    </div>
  );
}

/* TEAM: MAIN CONTENT */
interface TeamMember {
  name: string;
  img: string;
  univ: string;
  role: string;
  web: string;
}

export function TeamMainContent() {
  const { classes } = useStyles();
  const teamMembers: TeamMember[] = [
    {
      name: "Mingliang Liu",
      img: MingliangLiu,
      univ: "Washington State University",
      role: "Assistant Research Professor, Civil & Environmental Engineering",
      web: "https://ce.wsu.edu/faculty/liu-mingliang/",
    },
    {
      name: "Julie Padowski",
      img: JuliePadowski,
      univ: "Washington State University",
      role: "Research Associate Professor, School of the Environment",
      web: "https://environment.wsu.edu/faculty/wsu-profile/julie.padowski/",
    },
    {
      name: "Jenny Adam",
      img: JennyAdam,
      univ: "Washington State University",
      role: "Professor, Civil & Environmental Engineering",
      web: "https://ce.wsu.edu/faculty/adam/",
    },
    {
      name: "Roger Lew",
      img: RogerLew,
      univ: "University of Idaho",
      role: "Research Associate Professor, Virtual Technology and Design",
      web: "https://www.uidaho.edu/people/rogerlew",
    },
    {
      name: "Mariana Dobre",
      img: MarianaDobre,
      univ: "University of Idaho",
      role: "Assistant Professor, Soil and Water Systems",
      web: "https://www.uidaho.edu/people/mdobre",
    },
    {
      name: "Erin Brooks",
      img: ErinBrooks,
      univ: "University of Idaho",
      role: "Professor, Soil and Water Systems",
      web: "https://www.uidaho.edu/people/ebrooks",
    },
    {
      name: "Subhankar Das",
      img: SubhankarDas,
      univ: "University of Idaho",
      role: "Postdoctoral Fellow, Soil and Water Systems",
      web: "https://scholar.google.com/citations?user=K2ZoamkAAAAJ&hl=en",
    },
    {
      name: "Erin Hanan",
      img: ErinHanan,
      univ: "University of Nevada, Reno",
      role: "Associate Professor, Fire & Ecosystem Ecology",
      web: "https://www.unr.edu/nres/people/hanan-erin",
    },
    {
      name: "William Burke",
      img: WilliamBurke,
      univ: "University of Nevada, Reno",
      role: "Ecohydrologic Researcher",
      web: "https://www.wdburke.com/",
    },
    {
      name: "Lawrence Alawode",
      img: LawrenceAlawode,
      univ: "University of Nevada, Reno",
      role: "Doctoral Student, Hydrologic Sciences",
      web: "https://www.unr.edu/hydrologic-sciences/people/students/lawrence-gbenga-alawode",
    },
    {
      name: "Kevin Bladon",
      img: KevinBladon,
      univ: "Oregon State University",
      role: "Faculty, Forest Ecosystems & Society",
      web: "https://directory.forestry.oregonstate.edu/people/bladon-kevin",
    },
    {
      name: "Ryan Cole",
      img: RyanCole,
      univ: "Oregon State University",
      role: "Faculty Research Assistant, Wildfire and Water Security",
      web: "https://www.researchgate.net/profile/Ryan-Cole-9",
    },
    {
      name: "Pete Robichaud",
      img: PeteRobichaud,
      univ: "US Forest Service, Rocky Mtn Research Station",
      role: "Research Engineer, Erosion Modeling and Mitigation, Wildfires",
      web: "https://scholar.google.com/citations?user=wy3ols4AAAAJ&hl=en",
    },
  ];

  const groupedMembers = teamMembers.reduce(
    (acc, member) => {
      const { univ } = member;
      if (!acc[univ]) {
        acc[univ] = [];
      }
      acc[univ].push(member);
      return acc;
    },
    {} as Record<string, TeamMember[]>,
  );

  return (
    <div className={`${classes.aboutContainerMain} scroll-container`}>
      <div className={classes.textCenter}>
        {Object.entries(groupedMembers).map(([university, members]) => (
          <section key={university} id={university.replace(/\s+/g, "_")}>
            <h3 className={classes.univHeading}>{university}</h3>
            {members.map((person, index) => (
              <div key={index} className={classes.memberCard}>
                <img src={person.img} alt={person.name} />
                <div>
                  <h4>
                    <a href={person.web} target="_blank">
                      {person.name}
                    </a>
                  </h4>
                  <p>{person.role}</p>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>

      <div id="partner_section" className={classes.partnerSection}>
        <h2 className={classes.univHeading}>Partner Institutions</h2>
        <p>Pacific Northwest water utilities:</p>
        <ul>
          <li>
            <a href="https://www.seattle.gov/utilities" target="_blank">
              Seattle Public Utilities
            </a>
          </li>
          <li>
            <a href="https://www.portland.gov/water" target="_blank">
              Portland Water Bureau
            </a>
          </li>
          <li>
            <a href="https://www.eweb.org/" target="_blank">
              Eugene Water &amp; Electric Board
            </a>
          </li>
          <li>
            <a
              href="https://www.cityofsalem.net/community/household/water-utilities"
              target="_blank"
            >
              City of Salem
            </a>
          </li>
          <li>
            <a
              href="https://www.bremertonwa.gov/524/Utility-Billing"
              target="_blank"
            >
              City of Bremerton
            </a>
          </li>
          <li>
            <a href="https://www.medfordwater.org/" target="_blank">
              Medford Water Commission
            </a>
          </li>
          <li>
            <a href="https://www.clackamasproviders.org/" target="_blank">
              Clackamas River Water Providers
            </a>
          </li>
          <li>
            <a
              href="https://www.victoria.ca/home-property/utilities/water-system"
              target="_blank"
            >
              City of Victoria, Canada
            </a>
          </li>
          <li>
            <a
              href="https://doh.wa.gov/community-and-environment/drinking-water/office-drinking-water"
              target="_blank"
            >
              Washington Department of Health – Office of Drinking Water
            </a>
          </li>
          <li>
            <a href="https://www.waterrf.org/" target="_blank">
              The Water Research Foundation
            </a>
          </li>
        </ul>
      </div>
      <br />
      <br />
      <br />
    </div>
  );
}

function SidePanel({ children }: { children: React.ReactNode }): JSX.Element {
  const { classes } = useStyles();
  return (
    <div className={classes.sidePanel}>
      <div className={classes.sidePanelContent}>{children}</div>
    </div>
  );
}
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
    <div className={classes.aboutContainer}>
      <SidePanel>
        <TeamSidePanelContent />
      </SidePanel>
      <div className={classes.aboutWrapper} style={{ position: "relative" }}>
        <TeamMainContent />
      </div>
    </div>
  );
}
