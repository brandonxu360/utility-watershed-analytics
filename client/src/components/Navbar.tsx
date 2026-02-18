import { FC } from "react";
import { tss } from "../utils/tss";
import { Link } from "@tanstack/react-router";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DarkMode from "@mui/icons-material/DarkMode";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useColorMode } from "../contexts/ColorModeContext";

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
    textDecoration: "none",
    display: "inline-block",
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    transition: "background-color 150ms ease",
    ":hover": {
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.surface.main,
    },
  },
  colorToggle: {
    color: theme.palette.text.primary,
    marginLeft: theme.spacing(1.75),
  },
}));

const Navbar: FC = () => {
  const { classes } = useStyles();
  const { mode, toggleColorMode } = useColorMode();

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" className={classes.title}>
            FireWISE Watersheds
          </Typography>
          <Link to="/" className={classes.link}>
            Home
          </Link>
          <Link to="/team" className={classes.link}>
            Team
          </Link>
          <Link to="/about" className={classes.link}>
            About
          </Link>
          <Link to="/login" className={classes.link}>
            Login
          </Link>
          <IconButton className={classes.colorToggle} onClick={toggleColorMode}>
            {mode === "dark" ? <Brightness7Icon /> : <DarkMode />}
          </IconButton>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Navbar;
