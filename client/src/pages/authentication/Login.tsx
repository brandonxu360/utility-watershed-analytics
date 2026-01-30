import { useState, FormEvent, FC } from "react";
import { Link } from "@tanstack/react-router";
import { tss } from "tss-react";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import SmallScreenNotice from "../../components/small-screen-notice/SmallScreenNotice";
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

type LoginProps = {
  onSubmit?: (payload: { username: string; password: string }) => void;
  onSwitchToRegister?: () => void;
  forgotPasswordUrl?: string;
};

const useStyles = tss.create(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'calc(100vh - 64px)',
  },
  formContainer: {
    width: '100%',
    maxWidth: 500,
  },
  authCard: {
    width: '100%',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    boxSizing: 'border-box',
  },
  authFooter: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
  },
  forgotRow: {
    color: '#646cff',
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '12px',
    textDecoration: 'none',
  },
  linkButton: {
    color: '#646cff',
    textDecoration: 'none',
    marginLeft: 4,
  },
}));

const Login: FC<LoginProps> = ({ onSubmit }) => {
  const { classes } = useStyles();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isHidden, setIsHidden] = useState<boolean>(true);

  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { username, password };
    if (onSubmit) onSubmit(payload);
  };

  const toggleHidden = () => {
    setIsHidden((prev) => !prev);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div className={classes.root}>
      <div className={classes.formContainer}>
        <Paper elevation={3} className={classes.authCard} component="form" onSubmit={handleSubmit} noValidate>
          <div>
            <Typography variant="h4" component="h1" align="center" fontWeight={700}>
              Welcome Back!
            </Typography>
            <Typography variant="subtitle1" align="center">
              Please enter your details
            </Typography>
          </div>
          <FormControl fullWidth variant="outlined">
            <InputLabel htmlFor="login-username">Username</InputLabel>
            <OutlinedInput
              id="login-username"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel htmlFor="login-password">Password</InputLabel>
            <OutlinedInput
              id="login-password"
              type={isHidden ? "password" : "text"}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label={isHidden ? "Show password" : "Hide password"}
                    onClick={toggleHidden}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                    size="small"
                  >
                    {isHidden ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>
          <div className={classes.forgotRow}>
            <Link to="" className={classes.forgotRow}>Forgot password?</Link>
          </div>
          <Button type="submit" variant="contained" color="primary" fullWidth size="large">
            Log In
          </Button>
          <div className={classes.authFooter}>
            <Typography variant="body2">Don't have an account?</Typography>
            <Link to="/register" className={classes.linkButton}>Register</Link>
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default Login;
