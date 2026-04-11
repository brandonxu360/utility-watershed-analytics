import { tss } from "../utils/tss";
import Typography from "@mui/material/Typography";
import type { TeamMember } from "../data/team";

const useStyles = tss.create(({ theme }) => ({
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
}));

export default function MemberCard({ person }: { person: TeamMember }) {
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
}
