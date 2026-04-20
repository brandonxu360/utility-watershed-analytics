import { useNavigate } from "@tanstack/react-router";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { tss } from "../utils/tss";

const useStyles = tss.create(() => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    height: "calc(100vh - 64px)",
  },
}));

export default function NotFoundPage() {
  const { classes } = useStyles();
  const navigate = useNavigate();
  return (
    <div className={classes.root}>
      <Typography variant="h1" fontWeight="bold">
        404
      </Typography>
      <Typography variant="h4">Page not found</Typography>
      <Typography variant="body1" color="text.secondary">
        The page you&apos;re looking for doesn&apos;t exist.
      </Typography>
      <Button variant="contained" onClick={() => navigate({ to: "/" })}>
        Go home
      </Button>
    </div>
  );
}
