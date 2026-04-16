import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const STORAGE_KEY = 'ai-alcohol-theme';

export const ThemeContext = createContext(null);

const getInitialMode = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (_) {}
  return 'dark';
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) {}
  }, [mode]);

  const toggleTheme = () => {
    setMode((m) => (m === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#6366f1' : '#4f46e5',
            light: mode === 'dark' ? '#818cf8' : '#6366f1',
            dark: mode === 'dark' ? '#4f46e5' : '#4338ca',
          },
          secondary: {
            main: mode === 'dark' ? '#10b981' : '#059669',
          },
          background: {
            default: mode === 'dark' ? '#0b0d12' : '#f1f5f9',
            paper: mode === 'dark' ? '#121622' : '#ffffff',
          },
          error: { main: '#ef4444' },
          success: { main: '#10b981' },
          warning: { main: '#f59e0b' },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
          h1: { fontWeight: 700 },
          h2: { fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { borderRadius: 10 },
              contained: { boxShadow: 'none' },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: { borderRadius: 14 },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: 'outlined',
              size: 'small',
              fullWidth: true,
            },
            styleOverrides: {
              root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: { borderRadius: 14 },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                boxShadow: 'none',
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
            },
          },
        },
      }),
    [mode],
  );

  const value = useMemo(
    () => ({ mode, setMode, toggleTheme, theme }),
    [mode, theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode debe usarse dentro de ThemeProvider');
  return ctx;
}
