import { FC, useEffect, useRef, useState } from "react";
import { tss } from "../utils/tss";
import Button from "@mui/material/Button";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export type SelectProps = {
    id?: string;
    ariaLabel?: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
};

const useStyles = tss.create(({ theme }) => ({
    selectWrapper: {
        position: 'relative',
        display: 'inline-block',
        width: 120,
    },
    selectButton: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
        fontSize: theme.typography.body2.fontSize,
        color: theme.palette.primary.contrastText,
        backgroundColor: theme.palette.primary.main,
        cursor: 'pointer',
        textAlign: 'left',
        borderRadius: 0,
        border: 'none',
    },
    selectMenu: {
        position: 'absolute',
        left: 0,
        width: '100%',
        background: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.35)',
        zIndex: 20000,
        maxHeight: 'calc(4 * 2rem)',
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    selectItem: {
        padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
        cursor: 'pointer',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        '&:hover': {
            background: 'rgba(255, 255, 255, 0.06)',
        },
    },
}));

const Select: FC<SelectProps> = ({ id, ariaLabel, value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const { classes } = useStyles();

    // Close dropdown on outside click
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const selected = options.find((o) => o === value) ?? value;

    return (
        <div className={classes.selectWrapper} ref={wrapperRef}>
            <Button
                id={id}
                data-testid={id ? `select-${id}` : undefined}
                className={classes.selectButton}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => setOpen((s) => !s)}
                endIcon={<ExpandMoreIcon style={{ fontSize: "1.2rem" }} />}
            >
                {selected}
            </Button>

            {open && (
                <div role="listbox" className={classes.selectMenu} tabIndex={-1}>
                    {options.map((opt) => (
                        <div
                            key={opt}
                            role="option"
                            aria-selected={opt === value}
                            className={classes.selectItem}
                            onClick={() => {
                                onChange(opt);
                                setOpen(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Select;
