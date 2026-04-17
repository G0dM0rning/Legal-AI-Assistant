import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#3b82f6', // Bright Blue
            light: '#60a5fa',
            dark: '#2563eb',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#8b5cf6', // Violet
            light: '#a78bfa',
            dark: '#7c3aed',
            contrastText: '#ffffff',
        },
        background: {
            default: '#020617', // Main background (Slate 950)
            paper: '#0f172a',   // Card/Paper background (Slate 900)
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
        divider: 'rgba(255, 255, 255, 0.1)',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 800,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontWeight: 800,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontWeight: 700,
        },
        h4: {
            fontWeight: 700,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundImage: 'none',
                },
            },
        },
    },
});

export default theme;
