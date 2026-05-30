import { createTheme } from '@mui/material/styles';

const INK = '#15110f';
const RED = '#e8392b';
const YELLOW = '#ffd23f';
const PAPER = '#ffffff';
const BG = '#fbf7ee';

const HARD_SHADOW = `3px 3px 0 ${INK}`;
const HARD_SHADOW_LG = `6px 6px 0 ${INK}`;
const HARD_SHADOW_HOVER = `5px 5px 0 ${INK}`;
const HARD_SHADOW_ACTIVE = `1px 1px 0 ${INK}`;

const DISPLAY_FONT = '"Bangers", cursive';
const BODY_FONT = '"Hanken Grotesk", system-ui, sans-serif';

export const comicTheme = createTheme({
  appName: 'comic',
  accents: { pop: RED, pen: YELLOW },
  palette: {
    mode: 'light',
    primary: { main: RED, contrastText: '#fff' },
    secondary: { main: YELLOW, contrastText: INK },
    background: { default: BG, paper: PAPER },
    text: { primary: INK, secondary: '#4a443f', disabled: '#8a847d' },
    divider: INK,
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: BODY_FONT,
    h1: { fontFamily: DISPLAY_FONT, letterSpacing: '0.02em' },
    h2: { fontFamily: DISPLAY_FONT, fontSize: 18, letterSpacing: '0.03em' },
    h3: { fontFamily: DISPLAY_FONT, fontSize: 19, letterSpacing: '0.03em' },
    h4: { fontFamily: DISPLAY_FONT, fontSize: 22 },
    overline: {
      fontSize: 9, fontWeight: 800, letterSpacing: '0.10em',
      textTransform: 'uppercase', color: '#8a847d', lineHeight: 1.2,
    },
    button: { fontFamily: BODY_FONT, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(rgba(21,17,15,0.12) 1px, transparent 1.4px)',
          backgroundSize: '9px 9px',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0, square: false },
      styleOverrides: {
        root: {
          backgroundColor: PAPER,
          border: `3px solid ${INK}`,
          boxShadow: HARD_SHADOW_LG,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableRipple: true, disableElevation: true, variant: 'outlined' },
      styleOverrides: {
        root: {
          fontSize: 13,
          fontWeight: 800,
          padding: '10px 16px',
          border: `2.5px solid ${INK}`,
          borderRadius: 8,
          backgroundColor: PAPER,
          color: INK,
          boxShadow: HARD_SHADOW,
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
          gap: 8,
          '&:hover': {
            backgroundColor: YELLOW,
            border: `2.5px solid ${INK}`,
            transform: 'translate(-2px, -2px)',
            boxShadow: HARD_SHADOW_HOVER,
          },
          '&:active': { transform: 'translate(0, 0)', boxShadow: HARD_SHADOW_ACTIVE },
          '&.Mui-disabled': { opacity: 0.5, boxShadow: HARD_SHADOW, color: INK, border: `2.5px solid ${INK}` },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            backgroundColor: RED, color: '#fff', border: `2.5px solid ${INK}`,
            '&:hover': { backgroundColor: RED, border: `2.5px solid ${INK}` },
          },
        },
        {
          props: { variant: 'text' },
          style: {
            border: 'none', boxShadow: 'none', backgroundColor: 'transparent',
            padding: '6px 10px',
            '&:hover': { backgroundColor: YELLOW, boxShadow: 'none', transform: 'none', border: 'none' },
          },
        },
      ],
    },
    MuiIconButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          width: 36, height: 36, borderRadius: 8,
          border: `2.5px solid ${INK}`, backgroundColor: PAPER, color: INK,
          boxShadow: HARD_SHADOW,
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
          '&:hover': {
            backgroundColor: YELLOW,
            transform: 'translate(-2px, -2px)', boxShadow: HARD_SHADOW_HOVER,
          },
          '&:active': { transform: 'translate(0, 0)', boxShadow: HARD_SHADOW_ACTIVE },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700, fontSize: 13,
          border: `2.5px solid ${INK}`,
          borderRadius: 999,
          backgroundColor: PAPER, color: INK,
          height: 'auto', padding: '4px 4px',
          '&:hover': { backgroundColor: YELLOW },
          '&.Mui-disabled': { opacity: 0.5 },
        },
        label: { padding: '2px 8px' },
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: BG,
          borderRadius: 6,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: INK, borderWidth: 2.5 },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: INK, borderWidth: 2.5 },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: INK, borderWidth: 2.5 },
          fontWeight: 600,
          '& .MuiOutlinedInput-notchedOutline legend': {
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.10em',
          color: '#8a847d',
        },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { boxShadow: `8px 8px 0 ${INK}`, border: `3px solid ${INK}`, borderRadius: 10 } },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontFamily: DISPLAY_FONT, fontSize: 26, letterSpacing: '0.02em', paddingBottom: 4 } } },
    MuiBackdrop: { styleOverrides: { root: { backgroundColor: 'rgba(21,17,15,0.5)' } } },
  },
});
