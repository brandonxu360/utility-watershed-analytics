import { FC } from "react";
import { tss } from "tss-react";
import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const useStyles = tss.create(() => ({
  root: {
    flexGrow: 1,
  },
  title: {
    flexGrow: 1,
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
  link: {
    color: "#F5F5F5",
    marginLeft: "1rem",
    textDecoration: "none",
    ":hover": {
      color: "#535bf2",
    },
  },
}));

const Navbar: FC = () => {
  const { classes } = useStyles();

  return (
    <Box className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" className={classes.title}>
            FireWISE Watersheds
          </Typography>
          <Link to='/' className={classes.link}>Home</Link>
          <Link to='/login' className={classes.link}>Login</Link>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
