// components/theme/ThemeProvider.tsx
'use client';

import { createContext, useState, useMemo, useContext } from 'react';
import { ThemeProvider as MuiThemeProvider, PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../../lib/theme';

// Define the context type
type ThemeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

// Hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Props type for ThemeProvider
interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  // State to manage theme mode
  const [mode, setMode] = useState<PaletteMode>('light');

  // Memoize the theme to prevent unnecessary re-renders
  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [mode]
  );

  // Memoize the theme to prevent unnecessary re-renders
  const currentTheme = useMemo(() => theme(mode), [mode]);

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}