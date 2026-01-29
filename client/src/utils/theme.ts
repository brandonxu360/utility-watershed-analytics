import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
    interface Theme {
        mode: {
            colors: {
                primary100: string;
                primary200: string;
                primary300: string;
                primary400: string;
                primary500: string;
                error: string;
                text: string;
                background: string;
            };
            fs: {
                100: string;
                200: string;
                300: string;
                400: string;
                500: string;
                body: string;
                nav: string;
                button: string;
                primaryHeading: string;
            };
            fw: {
                regular: number;
            };
            space: {
                100: string;
                200: string;
                300: string;
                400: string;
                500: string;
                600: string;
                700: string;
                800: string;
                900: string;
            };
            misc: {
                lineHeight: number;
            };
        };
    }

    interface ThemeOptions {
        mode?: Partial<Theme["mode"]>;
    }
}

// Dark Mode
const darkMode = {
    colors: {
        primary100: "#F5F5F5",
        primary200: "#DCEDFF",
        primary300: "#00A896",
        primary400: "#444444",
        primary500: "#121212",
        error: "#FF4B3E",
        text: "#F5F5F5",
        background: "#242424",
    },
    fs: {
        100: "1rem",
        200: "1.2rem",
        300: "1.5rem",
        400: "3rem",
        500: "4.6875rem",
        body: "1.2rem",
        nav: "1rem",
        button: "1rem",
        primaryHeading: "3rem",
    },
    fw: {
        regular: 500,
    },
    space: {
        100: ".25rem",
        200: ".5rem",
        300: ".75rem",
        400: "1rem",
        500: "1.5rem",
        600: "2rem",
        700: "3rem",
        800: "4rem",
        900: "5rem",
    },
};

// Light Mode
const lightMode = {
    colors: {
        primary100: "#213547",
        primary200: "#E6F2FF",
        primary300: "#007B66",
        primary400: "#F1F1F1",
        primary500: "#FFFFFF",
        error: "#D6473B",
        text: "#213547",
        background: "#FFFFFF",
    },
};

const theme = createTheme({
    palette: {
        mode: "dark", // TODO: implement theme switching
        primary: {
            main: darkMode.colors.primary400,
            light: darkMode.colors.primary200,
            dark: darkMode.colors.primary500,
            contrastText: darkMode.colors.primary100,
        },
        error: { main: darkMode.colors.error },
        background: { default: darkMode.colors.background, paper: darkMode.colors.primary400 },
        text: { primary: darkMode.colors.text },
    },
    typography: {
        fontWeightRegular: darkMode.fw.regular,
        h1: { fontSize: darkMode.fs[400] },
    },
    mode: {
        ...darkMode,
    },
});

export const lightThemeTokens = lightMode;

export default theme;
