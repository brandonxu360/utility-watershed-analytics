import { tss } from "tss-react";

const useStyles = tss.create(() => ({
    root: {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        background: '#0f172a',
    },
    smallScreenTitle: {
        fontSize: '1.5rem',
        paddingBottom: 8,
        color: '#DCEDFF',
    },
    smallScreenBody: {
        color: '#F5F5F5',
    },
}));

export default function SmallScreenNotice(): JSX.Element {
    const { classes } = useStyles();
    return (
        <div className={classes.root}>
            <div role='alert'>
                <h1 id="small-screen-title" className={classes.smallScreenTitle}>Best viewed on larger screens</h1>
                <p className={classes.smallScreenBody}>
                    This experience is optimized for tablets and desktops. For the clearest maps, charts, and controls, please use a device with a wider display.
                </p>
            </div>
        </div>
    );
}
