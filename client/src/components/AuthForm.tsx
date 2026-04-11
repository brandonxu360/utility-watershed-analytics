import { useState, type FormEvent, type MouseEvent } from "react";
import { tss } from "../utils/tss";
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

const useStyles = tss.create(({ theme }) => ({
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
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(2),
  },
  forgotRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  forgotLink: {
    color: theme.palette.accent.main,
    fontSize: theme.typography.caption.fontSize,
    textDecoration: "none",
  },
  linkButton: {
    color: theme.palette.accent.main,
    fontSize: theme.typography.body2.fontSize,
    textDecoration: "none",
  },
}));

export type AuthFormProps =
  | {
      mode: "login";
      onSubmit?: (payload: { username: string; password: string }) => void;
    }
  | {
      mode: "register";
      onSubmit?: (payload: {
        username: string;
        password: string;
        confirmPassword: string;
      }) => void;
    };

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const { classes } = useStyles();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hidden, setHidden] = useState({ password: true, confirm: true });

  const isLogin = mode === "login";

  const toggleHidden = (field: "password" | "confirm") =>
    setHidden((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) =>
    e.preventDefault();
  const handleMouseUp = (e: MouseEvent<HTMLButtonElement>) =>
    e.preventDefault();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      onSubmit?.({ username, password, confirmPassword });
    } else {
      onSubmit?.({ username, password });
    }
  };

  return (
    <Paper
      elevation={3}
      className={classes.authCard}
      component="form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div>
        <Typography variant="h4" component="h1" align="center" fontWeight={700}>
          {isLogin ? "Welcome Back!" : "Create an account!"}
        </Typography>
        <Typography variant="subtitle1" align="center">
          Please enter your details
        </Typography>
      </div>

      <FormControl fullWidth variant="outlined">
        <InputLabel htmlFor="auth-username">Username</InputLabel>
        <OutlinedInput
          id="auth-username"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </FormControl>

      <FormControl fullWidth variant="outlined">
        <InputLabel htmlFor="auth-password">Password</InputLabel>
        <OutlinedInput
          id="auth-password"
          type={hidden.password ? "password" : "text"}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label={hidden.password ? "Show password" : "Hide password"}
                onClick={() => toggleHidden("password")}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                edge="end"
                size="small"
              >
                {hidden.password ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
        />
      </FormControl>

      {!isLogin && (
        <FormControl fullWidth variant="outlined">
          <InputLabel htmlFor="auth-confirm">Confirm Password</InputLabel>
          <OutlinedInput
            id="auth-confirm"
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
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  edge="end"
                  size="small"
                >
                  {hidden.confirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
      )}

      {isLogin && (
        <div className={classes.forgotRow}>
          {/* TODO: Replace with TanStack Link when building out auth */}
          <a href="/" className={classes.forgotLink}>
            Forgot password?
          </a>
        </div>
      )}

      <Button
        type="submit"
        variant="contained"
        color="secondary"
        fullWidth
        size="large"
      >
        {isLogin ? "Log In" : "Sign Up"}
      </Button>

      <div className={classes.authFooter}>
        <Typography variant="body2">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </Typography>
        {/* TODO: Replace with TanStack Link when building out auth */}
        <a
          href={isLogin ? "/register" : "/login"}
          className={classes.linkButton}
        >
          {isLogin ? "Register" : "Login"}
        </a>
      </div>
    </Paper>
  );
}
