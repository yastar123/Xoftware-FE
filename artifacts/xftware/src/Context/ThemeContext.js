import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const ThemeToggleContext = createContext({
  toggleColorMode: () => {},
  mode: "light",
  customColors: {},
});

export const useThemeToggle = () => useContext(ThemeToggleContext);

export default function ThemeToggleProvider({ children, customColors = {} }) {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme-mode");
    if (saved) setMode(saved);
  }, []);

  const toggleColorMode = () => {
    const next = mode === "light" ? "dark" : "light";
    localStorage.setItem("theme-mode", next);
    setMode(next);
  };

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        primary: {
          main: mode === "dark" ? "#818CF8" : "#6366F1",
          light: mode === "dark" ? "#A5B4FC" : "#818CF8",
          dark: "#4F46E5",
        },
        secondary: {
          main: mode === "dark" ? "#94A3B8" : "#64748B",
          light: mode === "dark" ? "#CBD5E1" : "#94A3B8",
        },
        error: { main: mode === "dark" ? "#F87171" : "#EF4444" },
        warning: { main: mode === "dark" ? "#FBBF24" : "#F59E0B" },
        info: { main: mode === "dark" ? "#60A5FA" : "#3B82F6" },
        success: { main: mode === "dark" ? "#4ADE80" : "#22C55E" },
        background: {
          default: mode === "dark" ? "#0F172A" : "#F8FAFC",
          paper: mode === "dark" ? "#1E293B" : "#FFFFFF",
        },
        text: {
          primary: mode === "dark" ? "#F1F5F9" : "#0F172A",
          secondary: mode === "dark" ? "#94A3B8" : "#64748B",
          disabled: mode === "dark" ? "#475569" : "#94A3B8",
        },
        divider: mode === "dark" ? "#334155" : "#E2E8F0",
      },
      typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        h1: { fontWeight: 700, letterSpacing: "-0.02em" },
        h2: { fontWeight: 700, letterSpacing: "-0.02em" },
        h3: { fontWeight: 700, letterSpacing: "-0.02em" },
        h4: { fontWeight: 600, letterSpacing: "-0.01em" },
        h5: { fontWeight: 600, letterSpacing: "-0.01em" },
        h6: { fontWeight: 600, letterSpacing: "-0.01em" },
        body1: { lineHeight: 1.6 },
        body2: { lineHeight: 1.6 },
        button: { fontWeight: 600, textTransform: "none" },
      },
      shape: { borderRadius: 2 },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 2,
              padding: "10px 24px",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            },
            contained: {
              "&:hover": { boxShadow: "0 4px 12px rgba(99,102,241,0.25)" },
            },
            outlined: {
              borderColor: "#E2E8F0",
              "&:hover": { borderColor: "#6366F1" },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              boxShadow: "none",
              transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s cubic-bezier(0.22,1,0.36,1), border-color 0.35s cubic-bezier(0.22,1,0.36,1)",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 20px 40px -12px rgba(99,102,241,0.10)",
                borderColor: "#A5B4FC",
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: { borderRadius: 3, backgroundImage: "none" },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: { borderRadius: 2, fontWeight: 500 },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: { borderRadius: 2 },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: { borderRadius: 4 },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: { borderRight: "1px solid #E2E8F0" },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: { borderColor: "#E2E8F0" },
            head: {
              fontWeight: 600,
              color: "#64748B",
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
            },
          },
        },
        MuiSkeleton: {
          styleOverrides: {
            root: { borderRadius: 2 },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: "none",
              borderBottom: "1px solid #E2E8F1",
              backgroundColor: "#FFFFFF",
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ThemeToggleContext.Provider value={{ toggleColorMode, mode, customColors }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}
