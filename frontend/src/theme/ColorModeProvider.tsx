import { useMemo, useState, type ReactNode } from 'react';
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { ColorModeContext, type ColorMode } from './colorMode';

const STORAGE_KEY = 'gatherly.colorMode';

function readStored(): ColorMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [stored, setStored] = useState<ColorMode | null>(readStored);
  const mode: ColorMode = stored ?? (prefersDark ? 'dark' : 'light');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'dark' ? '#8c9eff' : '#3d5afe' },
          secondary: { main: mode === 'dark' ? '#ff80ab' : '#f50057' },
          background:
            mode === 'dark' ? { default: '#0f1117', paper: '#171a23' } : { default: '#f6f7fb', paper: '#ffffff' },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 700 },
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
          MuiCard: { defaultProps: { variant: 'outlined' } },
          MuiButton: { defaultProps: { disableElevation: true } },
          MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
        },
      }),
    [mode],
  );

  const value = useMemo(
    () => ({
      mode,
      toggle: () => {
        const next: ColorMode = mode === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // ignore
        }
        setStored(next);
      },
    }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
