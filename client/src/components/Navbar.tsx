import { FC } from "react";
import { tss } from "../utils/tss";
import { Link } from "@tanstack/react-router";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const useStyles = tss.create(({ theme }) => ({
  root: {
    flexGrow: 1,
  },
  title: {
    flexGrow: 1,
    fontSize: theme.typography.body1.fontSize,
    fontWeight: "bold",
  },
  link: {
    color: theme.palette.text.primary,
    marginLeft: theme.spacing(2),
    textDecoration: "none",
    ":hover": {
      color: theme.palette.accent.dark,
    },
  },
}));

const Navbar: FC = () => {
  const { classes } = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" className={classes.title}>
            FireWISE Watersheds
          </Typography>
          <Link to='/' className={classes.link}>Home</Link>
          <Link to='/login' className={classes.link}>Login</Link>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Navbar;
