import { Theme } from "@mui/material/styles";
import type { CSSObject } from "tss-react";

export const commonStyles = (theme: Theme) =>
({
  aboutContainer: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 64px)",
    overflow: "hidden",
    "& p, & ul, & ol": {
      fontSize: "1.2rem",
    },
    "& a": {
      color: theme.palette.accent.main,
      fontWeight: 800,
    },
  } as CSSObject,
  aboutWrapper: {
    flex: 1,
    minHeight: 0,
    overflowY: "scroll",
  } as CSSObject,
  sidePanel: {
    width: "30%",
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    background: theme.palette.surface.overlay,
    color: theme.palette.text.primary,
    "& button:hover": {
      background: `${theme.palette.action.hover} !important`,
      color: `${theme.palette.accent.main} !important`,
    },
    "& h2": {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "var(--size-400)",
    },
    "& h3": {
      marginBottom: "var(--size-300)",
    },
    "& h3, & strong": {
      fontSize: "1.7rem",
      fontWeight: "bold",
    },
    "& p": {
      fontSize: "1.2rem",
      marginBottom: "var(--size-400)",
    },
    "& hr": {
      marginTop: 20,
      marginBottom: 30,
      borderColor: theme.palette.divider,
    },
  } as CSSObject,
  sidePanelContent: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "10px 30px 0",
    boxSizing: "border-box",
  } as CSSObject,
  aboutContainerMain: {
    width: "100%",
    textAlign: "left",
    color: theme.palette.text.primary,
    background:
      theme.palette.mode === "light"
        ? theme.palette.surface.main
        : theme.palette.background.default,
    padding: "0 40px 50px 40px",
    "& p": {
      fontSize: "1.2rem",
    },
    "& h2": {
      textAlign: "center",
      fontSize: "2rem",
      fontWeight: 800,
      paddingTop: 30,
      marginBottom: 30,
    },
    "& h3": {
      textAlign: "left",
      fontSize: "1.7em",
      fontWeight: 800,
      paddingTop: 20,
      marginBottom: 20,
    },
    "& h4": {
      fontSize: "1.3em",
      fontWeight: 800,
      paddingTop: 20,
      marginBottom: 20,
    },
    "& p img": {
      height: "auto",
      width: "100%",
      maxWidth: 350,
      marginLeft: "auto",
      marginRight: "auto",
    },
    "& p, & ul": {
      marginBottom: 24,
    },
    "& ul, & ol": {
      paddingLeft: 50,
    },
    "& ul li span, & ol li span": {
      fontWeight: 800,
      fontStyle: "italic",
    },
    "& li": {
      marginBottom: 16,
      fontSize: "1.2rem",
    },
    "& strong": {
      fontWeight: 800,
    },
    "& section": {
      padding: "40px 40px 0 40px",
    },
  } as CSSObject,
  textCenter: {
    textAlign: "center",
  } as CSSObject,
  dash: {
    fontSize: "3em",
    fontWeight: 100,
  } as CSSObject,
});

export const subPageStyles = (theme: Theme) =>
({
  closeButton: {
    background: theme.palette.error.main,
    border: "none",
    borderRadius: 3,
    color: theme.palette.common.white,
    "&:hover": {
      background: `${theme.palette.error.dark} !important`,
      border: "none",
      borderRadius: "3px !important",
      color: `${theme.palette.common.white} !important`,
      cursor: "pointer",
    },
  } as CSSObject,
  nutshell: {
    marginTop: 20,
    "& h3": {
      fontSize: "1.5rem !important",
    },
    "& p": {
      marginBottom: 22,
    },
    "& span": {
      fontWeight: 800,
      color: theme.palette.text.primary,
      background: theme.palette.action.selected,
      padding: "3px 6px",
      borderRadius: 4,
    },
  } as CSSObject,
});

export const navStyles = (theme: Theme) =>
({
  navButtons: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    "& button": {
      background: "transparent",
      border: "none",
      borderBottom: `1px solid ${theme.palette.text.primary}`,
      borderRadius: 0,
      padding: "8px 16px",
      color: theme.palette.text.primary,
      cursor: "pointer",
      textAlign: "left",
      fontSize: 18,
    },
    "& button:hover": {
      borderBottom: `1px solid ${theme.palette.accent.main}`,
      color: theme.palette.accent.main,
    },
  } as CSSObject,
  actionButton: {
    fontSize: "1.2rem",
  } as CSSObject,
});
