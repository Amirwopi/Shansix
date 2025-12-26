"use client"

"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

function ThemeWatcher() {
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const getTehranHour = () => {
      const now = new Date();
      const tehranTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tehran',
        hour: 'numeric',
        hour12: false,
      }).format(now);
      return parseInt(tehranTime, 10);
    };

    if (theme === 'system') {
      const hour = getTehranHour();
      // Set to dark mode between 6 PM (18) and 6 AM (6)
      if (hour >= 18 || hour < 6) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    }
    // We only want this to run when the theme is 'system', and once on mount if so.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
      <NextThemesProvider {...props}>
        {children}
        <ThemeWatcher />
      </NextThemesProvider>
  )
}
