import { tss } from "../utils/tss";
import Button from "@mui/material/Button";

const useStyles = tss.create(({ theme }) => ({
  root: {
    background: theme.palette.error.main,
    color: theme.palette.common.white,
    borderRadius: 3,
    padding: "5px 8px",
    margin: "16px 0",
    minWidth: "auto",
    textTransform: "none",
    "&:hover": {
      background: theme.palette.error.dark,
    },
  },
}));

interface BackButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
}

export default function BackButton({
  onClick,
  label,
  className,
}: BackButtonProps) {
  const { classes, cx } = useStyles();

  return (
    <Button
      className={cx(classes.root, className)}
      onClick={onClick}
      aria-label={label}
    >
      BACK
    </Button>
  );
}
