import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    appName: 'comic' | 'ink';
    accents: {
      pop: string;
      pen: string;
    };
  }
  interface ThemeOptions {
    appName?: 'comic' | 'ink';
    accents?: {
      pop?: string;
      pen?: string;
    };
  }
}
