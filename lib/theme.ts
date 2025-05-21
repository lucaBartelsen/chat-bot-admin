// lib/theme.ts
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Brand colors
const primaryColor = '#d2b3e2'; // Light purple/lavender
const backgroundColor = '#f9f9f9'; // Off-white

// Theme color definitions
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: {
      main: primaryColor,
      dark: '#b08ebf', // Darker shade for hover states
      light: '#e6d7ef', // Lighter shade for backgrounds
      contrastText: '#333333',
    },
    secondary: {
      main: '#9c64b3', // Accent color for important CTAs
      dark: '#7a4d8c',
      light: '#bb8ecb',
      contrastText: '#ffffff',
    },
    background: {
      default: backgroundColor,
      paper: mode === 'light' ? '#ffffff' : '#262626',
    },
    text: {
      primary: mode === 'light' ? '#333333' : '#f1f1f1',
      secondary: mode === 'light' ? '#666666' : '#c7c7c7',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    success: {
      main: '#2e7d32',
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light' ? primaryColor : '#333333',
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Create responsive theme
const theme = (mode: PaletteMode) => {
  let appTheme = createTheme(getDesignTokens(mode));
  appTheme = responsiveFontSizes(appTheme);
  return appTheme;
};

export default theme;