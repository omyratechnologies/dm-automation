import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Hook to safely access the current theme with proper SSR handling
 * Prevents hydration mismatches by only returning theme after mount
 */
export function useThemeAware() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the actual resolved theme (handles "system" theme)
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  return {
    theme: mounted ? theme : undefined,
    resolvedTheme: mounted ? resolvedTheme : undefined,
    setTheme,
    mounted,
    isDark: mounted ? resolvedTheme === "dark" : false,
    isLight: mounted ? resolvedTheme === "light" : false,
  };
}

/**
 * Get theme-aware color values
 */
export const getThemeColor = (lightColor: string, darkColor: string, theme?: string) => {
  return theme === "dark" ? darkColor : lightColor;
};

/**
 * Theme-aware class names helper
 */
export const themeClasses = {
  card: "bg-card dark:bg-[#1D1D1D] border border-border",
  cardHover: "bg-card dark:bg-[#1D1D1D] border border-border hover:bg-bg-hover transition-colors",
  popover: "bg-bg-popover dark:bg-[#1D1D1D] shadow-lg border-border",
  text: {
    primary: "text-text-primary",
    secondary: "text-text-secondary",
    muted: "text-muted-foreground",
  },
  bg: {
    primary: "bg-background",
    secondary: "bg-secondary",
    muted: "bg-muted",
    card: "bg-card",
  },
  border: "border-border",
  input: "bg-background border-input",
  button: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  },
};
