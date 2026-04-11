import { tss } from "../utils/tss";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import SmallScreenNotice from "../components/SmallScreenNotice";
import AuthForm, { type AuthFormProps } from "../components/AuthForm";

const useStyles = tss.create(() => ({
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
}));

export default function Auth(props: AuthFormProps) {
  const { classes } = useStyles();
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) return <SmallScreenNotice />;

  return (
    <div className={classes.root}>
      <div className={classes.formContainer}>
        <AuthForm {...props} />
      </div>
    </div>
  );
}
