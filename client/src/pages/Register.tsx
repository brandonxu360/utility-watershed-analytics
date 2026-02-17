import { useState, FormEvent, FC } from "react";
import { Link } from "@tanstack/react-router";
import { tss } from "../utils/tss";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import SmallScreenNotice from "../components/SmallScreenNotice";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export interface RegisterProps {
  onSubmit?: (payload: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => void;
}

const useStyles = tss.create(({ theme }) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "calc(100vh - 64px)",
  },
  formContainer: {
    width: "100%",
    maxWidth: 500,
  },
  authCard: {
    width: "100%",
    padding: `${theme.spacing(4)} ${theme.spacing(2)}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    boxSizing: "border-box",
  },
  authFooter: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  linkButton: {
    color: theme.palette.accent.main,
    textDecoration: "none",
    marginLeft: theme.spacing(0.5),
  },
}));

const Register: FC<RegisterProps> = ({ onSubmit }) => {
  const { classes } = useStyles();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hidden, setHidden] = useState({ password: true, confirm: true });

  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { username, password, confirmPassword };
    if (onSubmit) onSubmit(payload);
  };

  const toggleHidden = (field: "password" | "confirm") => {
    setHidden((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  return (
    <div className={classes.root}>
      <div className={classes.formContainer}>
        <Paper
          elevation={3}
          className={classes.authCard}
          component="form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div>
            <Typography
              variant="h4"
              component="h1"
              align="center"
              fontWeight={700}
            >
              Create an account!
            </Typography>
            <Typography variant="subtitle1" align="center">
              Please enter your details
            </Typography>
          </div>
          <FormControl fullWidth variant="outlined">
            <InputLabel htmlFor="reg-username">Username</InputLabel>
            <OutlinedInput
              id="reg-username"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel htmlFor="reg-password">Password</InputLabel>
            <OutlinedInput
              id="reg-password"
              type={hidden.password ? "password" : "text"}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      hidden.password ? "Show password" : "Hide password"
                    }
                    onClick={() => toggleHidden("password")}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                    size="small"
                  >
                    {hidden.password ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel htmlFor="reg-confirm">Confirm Password</InputLabel>
            <OutlinedInput
              id="reg-confirm"
              type={hidden.confirm ? "password" : "text"}
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      hidden.confirm
                        ? "Show confirm password"
                        : "Hide confirm password"
                    }
                    title={
                      hidden.confirm
                        ? "Show confirm password"
                        : "Hide confirm password"
                    }
                    aria-pressed={!hidden.confirm}
                    onClick={() => toggleHidden("confirm")}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                    size="small"
                  >
                    {hidden.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
          >
            Sign Up
          </Button>
          <div className={classes.authFooter}>
            <Typography variant="body2">Already have an account?</Typography>
            <Link to="/login" className={classes.linkButton}>
              Login
            </Link>
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default Register;
