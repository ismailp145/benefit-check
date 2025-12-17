import { CardTheme } from "./cards";

export function applyTheme(theme: CardTheme): void {
  const root = document.documentElement;
  
  // Apply CSS variables for theme colors
  root.style.setProperty("--color-secondary", theme.secondary);
  root.style.setProperty("--color-primary", theme.primary);
}

export function getThemeColors(theme: CardTheme) {
  return {
    primary: theme.primary,
    secondary: theme.secondary,
  };
}

