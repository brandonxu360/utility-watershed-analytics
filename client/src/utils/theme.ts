import { createTheme, TypographyVariantsOptions, Components, Theme } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

declare module "@mui/material/styles" {
  interface Palette {
    accent: Palette["primary"];
    surface: {
      main: string;
      light: string;
      dark: string;
      overlay: string;
      border: string;
    };
    muted: {
      main: string;
    };
  }
  interface PaletteOptions {
    accent?: PaletteOptions["primary"];
    surface?: {
      main: string;
      light: string;
      dark: string;
      overlay: string;
      border: string;
    };
    muted?: {
      main: string;
    };
  }
}

// Common typography
const typography: TypographyVariantsOptions = {
  fontWeightRegular: 500,
  h1: { fontSize: "3rem" },
  h2: { fontSize: "2rem" },
  h3: { fontSize: "1.5rem" },
  h4: { fontSize: "1.25rem" },
  h5: { fontSize: "1.125rem" },
  h6: { fontSize: "1rem" },
  body1: { fontSize: "1.2rem" },
  body2: { fontSize: "1rem" },
  subtitle1: { fontSize: "1rem" },
  subtitle2: { fontSize: "0.875rem" },
  caption: { fontSize: "0.75rem" },
  button: { fontSize: "1rem" },
};

// Common components styles
const components: Components<Omit<Theme, "components">> = {
  MuiCssBaseline: {
    styleOverrides: (themeParam: Theme) => ({
      body: {
        scrollbarColor: `${themeParam.palette.muted.main} ${themeParam.palette.background.default}`,
        "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
          backgroundColor: themeParam.palette.background.default,
        },
        "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
          borderRadius: 8,
          backgroundColor: themeParam.palette.muted.main,
          minHeight: 24,
          border: `3px solid ${themeParam.palette.background.default}`,
        },
        "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus":
        {
          backgroundColor: themeParam.palette.accent.main,
        },
        "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active":
        {
          backgroundColor: themeParam.palette.accent.main,
        },
        "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
        {
          backgroundColor: themeParam.palette.accent.light,
        },
        "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
          backgroundColor: themeParam.palette.background.default,
        },
      },
    }),
  },
};

const darkPalette = {
  mode: "dark" as PaletteMode,
  primary: {
    main: "#444444",
    light: "#DCEDFF",
    dark: "#121212",
    contrastText: "#F5F5F5",
  },
  secondary: {
    main: "#00A896",
  },
  error: {
    main: "#FF4B3E",
  },
  background: {
    default: "#242424",
    paper: "#444444",
  },
  text: {
    primary: "#F5F5F5",
    secondary: "#DCEDFF",
  },
  accent: {
    main: "#646cff",
    light: "#818cf8",
    dark: "#535bf2",
    contrastText: "#F5F5F5",
  },
  surface: {
    main: "#444444",
    light: "#F5F5F5",
    dark: "#121212",
    overlay: "rgba(0, 0, 0, 0.8)",
    border: "#000000",
  },
  muted: {
    main: "#666666",
  },
};

const lightPalette = {
  mode: "light" as PaletteMode,
  primary: {
    main: "#e0e0e0",
    light: "#E6F2FF",
    dark: "#F5F5F5",
    contrastText: "#213547",
  },
  secondary: {
    main: "#007B66",
  },
  error: {
    main: "#D6473B",
  },
  background: {
    default: "#FFFFFF",
    paper: "#F1F1F1",
  },
  text: {
    primary: "#213547",
    secondary: "#5C6B7F",
  },
  accent: {
    main: "#646cff",
    light: "#818cf8",
    dark: "#535bf2",
    contrastText: "#FFFFFF",
  },
  surface: {
    main: "#F1F1F1",
    light: "#FFFFFF",
    dark: "#E0E0E0",
    overlay: "rgba(255, 255, 255, 0.8)",
    border: "#E0E0E0",
  },
  muted: {
    main: "#9E9E9E",
  },
};

export const darkTheme = createTheme({
  palette: darkPalette,
  typography,
  components,
});

export const lightTheme = createTheme({
  palette: lightPalette,
  typography,
  components,
});

export default darkTheme;
