import { createTheme } from '@mui/material/styles';

const INK = '#111111';
const INK_2 = '#444444';
const INK_3 = '#8a8a8a';
const INK_4 = '#c4c4c4';
const LINE = '#e6e6e6';
const LINE_2 = '#d2d2d2';

// Easy swap target: change BODY_FONT / DISPLAY_FONT here (e.g. to `"Inter", system-ui, sans-serif`)
// and update the <link> in index.html accordingly.
const BODY_FONT = '"Newsreader", Georgia, serif';
const DISPLAY_FONT = '"Newsreader", Georgia, serif';

export const inkTheme = createTheme({
  appName: 'ink',
  accents: { pop: INK, pen: INK },
  palette: {
    mode: 'light',
    primary: { main: INK, contrastText: '#fff' },
    secondary: { main: INK_2, contrastText: '#fff' },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: INK, secondary: INK_2, disabled: INK_4 },
    divider: LINE,
  },
  shape: { borderRadius: 0 },
  typography: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    h1: { fontFamily: DISPLAY_FONT, fontStyle: 'italic', fontWeight: 400 },
    h2: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: INK_3, fontFamily: BODY_FONT, fontWeight: 400 },
    h3: { fontFamily: DISPLAY_FONT, fontSize: 22, fontStyle: 'italic', fontWeight: 400 },
    h4: { fontFamily: DISPLAY_FONT, fontSize: 24, fontStyle: 'italic', fontWeight: 400 },
    overline: {
      fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
      color: INK_3, lineHeight: 1.4,
    },
    button: { fontFamily: BODY_FONT, fontWeight: 400, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundImage: 'none' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableRipple: true, disableElevation: true, variant: 'outlined' },
      styleOverrides: {
        root: {
          fontSize: 15,
          padding: '9px 18px',
          border: `1px solid ${INK}`,
          borderRadius: 0,
          backgroundColor: 'transparent',
          color: INK,
          boxShadow: 'none',
          gap: 8,
          transition: 'all 0.12s ease',
          '&:hover': {
            backgroundColor: INK, color: '#fff',
            border: `1px solid ${INK}`,
          },
          '&.Mui-disabled': { opacity: 0.4, color: INK, border: `1px solid ${INK}` },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            backgroundColor: INK, color: '#fff', border: `1px solid ${INK}`,
            '&:hover': { backgroundColor: '#000', border: `1px solid ${INK}` },
          },
        },
        {
          props: { variant: 'text' },
          style: {
            border: 'none', padding: '4px 10px', fontStyle: 'italic',
            '&:hover': { backgroundColor: 'transparent', color: INK_2 },
          },
        },
      ],
    },
    MuiIconButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          width: 36, height: 36, borderRadius: 0,
          border: `1px solid ${INK}`, backgroundColor: 'transparent', color: INK,
          '&:hover': { backgroundColor: INK, color: '#fff' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: 16, fontStyle: 'italic',
          border: 'none', borderRadius: 0,
          backgroundColor: 'transparent', color: INK_3,
          height: 'auto',
          '&:hover': { backgroundColor: 'transparent', color: INK_2 },
        },
        label: { padding: '2px 0' },
      },
    },
    MuiTextField: { defaultProps: { variant: 'standard' } },
    MuiInput: {
      styleOverrides: {
        root: {
          '&:before': { borderBottom: `1px solid ${INK}` },
          '&:after': { borderBottom: `1px solid ${INK}` },
          '&:hover:not(.Mui-disabled):before': { borderBottom: `1px solid ${INK}` },
          fontFamily: BODY_FONT, fontSize: 19,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.16em',
          color: INK_3,
        },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { border: `1px solid ${INK}`, borderRadius: 0, boxShadow: 'none' } },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontFamily: DISPLAY_FONT, fontSize: 22, fontStyle: 'italic', fontWeight: 400 } } },
    MuiBackdrop: { styleOverrides: { root: { backgroundColor: 'rgba(17,17,17,0.4)' } } },
    MuiDivider: { styleOverrides: { root: { borderColor: LINE_2 } } },
  },
});

export const inkPalette = { INK, INK_2, INK_3, INK_4, LINE, LINE_2 };
