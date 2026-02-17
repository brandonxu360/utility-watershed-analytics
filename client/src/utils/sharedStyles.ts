import type { CSSObject } from 'tss-react';

export const commonStyles = {
  aboutContainer: {
    display: 'flex',
    flex: 1,
    height: 'calc(100vh - 64px)',
    overflow: 'hidden',
    '& p, & ul, & ol': {
      fontSize: '1.2rem',
    },
    '& a': {
      color: '#a3a8fa',
      fontWeight: 800,
    },
  } as CSSObject,
  aboutWrapper: {
    flex: 1,
    minHeight: 0,
    overflowY: 'scroll',
  } as CSSObject,
  sidePanel: {
    width: '30%',
    minWidth: 280,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    background: 'rgba(18, 18, 18, 0.9)',
    color: 'var(--clr-primary-100)',
    '& button:hover': {
      background: '#000 !important',
      color: '#a3a8fa !important',
    },
    '& h2': {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: 'var(--size-400)',
    },
    '& h3': {
      marginBottom: 'var(--size-300)',
    },
    '& h3, & strong': {
      fontSize: '1.7rem',
      fontWeight: 'bold',
    },
    '& p': {
      fontSize: '1.2rem',
      marginBottom: 'var(--size-400)',
    },
    '& hr': {
      marginTop: 20,
      marginBottom: 30,
    },
  } as CSSObject,
  sidePanelContent: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '10px 30px 0',
    boxSizing: 'border-box',
  } as CSSObject,
  aboutContainerMain: {
    width: '100%',
    textAlign: 'left',
    color: 'white',
    background: '#121212',
    padding: '0 40px 50px 40px',
    '& p': {
      fontSize: '1.2rem',
    },
    '& h2': {
      textAlign: 'center',
      fontSize: '2rem',
      fontWeight: 800,
      paddingTop: 30,
      marginBottom: 30,
    },
    '& h3': {
      textAlign: 'left',
      fontSize: '1.7em',
      fontWeight: 800,
      paddingTop: 20,
      marginBottom: 20,
    },
    '& h4': {
      fontSize: '1.3em',
      fontWeight: 800,
      paddingTop: 20,
      marginBottom: 20,
    },
    '& p img': {
      height: 'auto',
      width: '100%',
      maxWidth: 350,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    '& p, & ul': {
      marginBottom: 24,
    },
    '& ul, & ol': {
      paddingLeft: 50,
    },
    '& ul li span, & ol li span': {
      fontWeight: 800,
      fontStyle: 'italic',
    },
    '& li': {
      marginBottom: 16,
      fontSize: '1.2rem',
    },
    '& strong': {
      fontWeight: 800,
    },
    '& section': {
      padding: '40px 40px 0 40px',
    },
  } as CSSObject,
  textCenter: {
    textAlign: 'center',
  } as CSSObject,
  dash: {
    fontSize: '3em',
    fontWeight: 100,
  } as CSSObject,
};

export const subPageStyles = {
  closeButton: {
    background: '#FF4B3E',
    border: 'none',
    borderRadius: 3,
    color: 'white',
    '&:hover': {
      background: '#FF4B3E !important',
      border: 'none',
      borderRadius: '3px !important',
      color: 'white !important',
      cursor: 'pointer',
    },
  } as CSSObject,
  nutshell: {
    marginTop: 20,
    '& h3': {
      fontSize: '1.5rem !important',
    },
    '& p': {
      marginBottom: 22,
    },
    '& span': {
      fontWeight: 800,
      color: '#000',
      background: '#eee',
      padding: '3px 6px',
      borderRadius: 4,
    },
  } as CSSObject,
};

export const navStyles = {
  navButtons: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    '& button': {
      background: 'transparent',
      border: 'none',
      borderBottom: 'var(--clr-primary-100) 1px solid',
      borderRadius: 0,
      padding: '8px 16px',
      color: 'var(--clr-primary-100)',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: 18,
    },
    '& button:hover': {
      borderBottom: '1px solid #a3a8fa',
    },
  } as CSSObject,
  actionButton: {
    fontSize: '1.2rem',
  } as CSSObject,
};