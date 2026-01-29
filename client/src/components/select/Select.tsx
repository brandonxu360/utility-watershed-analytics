import { FC, useEffect, useRef, useState } from "react";
import { tss } from "tss-react";
import { useTheme } from '@mui/material/styles';
import type { ThemeMode } from '../../utils/theme';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export type SelectProps = {
    id?: string;
    ariaLabel?: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
};

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
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
        padding: '.25rem .5rem',
        fontSize: '1rem',
        color: mode.colors.primary100,
        backgroundColor: mode.colors.primary400,
        cursor: 'pointer',
        textAlign: 'left',
        borderRadius: 0,
        border: 'none',
    },
    selectMenu: {
        position: 'absolute',
        left: 0,
        width: '100%',
        background: mode.colors.primary400,
        color: mode.colors.primary100,
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.35)',
        zIndex: 20000,
        maxHeight: 'calc(4 * 2rem)',
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    selectItem: {
        padding: '.35rem .5rem',
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

    const theme = useTheme();
    const mode = (theme as { mode: ThemeMode }).mode;
    const { classes } = useStyles({ mode });

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
        <Box className={classes.selectWrapper} ref={wrapperRef}>
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
                <Box role="listbox" className={classes.selectMenu} tabIndex={-1}>
                    {options.map((opt) => (
                        <Box
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
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default Select;
