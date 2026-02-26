import { createTheme } from '@mui/material/styles';
import createCache from '@emotion/cache';
import prefixer from 'stylis-plugin-rtl';

export const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer],
});

export const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: '"Vazirmatn", "Tahoma", sans-serif',
    fontSize: 14,
  },
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#388e3c',
      light: '#66bb6a',
      dark: '#2e7d32',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { fontFamily: '"Vazirmatn", sans-serif', fontWeight: 500 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { fontFamily: '"Vazirmatn", sans-serif' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontFamily: '"Vazirmatn", sans-serif' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"Vazirmatn", sans-serif' },
      },
    },
  },
});
