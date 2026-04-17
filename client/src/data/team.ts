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
import AbdisaKebebew from "../assets/images/abdisa_kebebew.jpg";

export interface TeamMember {
  name: string;
  img: string;
  role: string;
  web: string;
}

export interface UniversityGroup {
  name: string;
  members: TeamMember[];
}

export const groupedMembers: UniversityGroup[] = [
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
      {
        name: "Abdisa Kebebew",
        img: AbdisaKebebew,
        role: "Graduate Research Assistant",
        web: "https://scholar.google.com/citations?hl=en&user=0xbYpO4AAAAJ",
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
