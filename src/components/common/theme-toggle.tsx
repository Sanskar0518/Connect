"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center opacity-50" />
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="w-9 h-9 rounded-lg border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label="Toggle theme"
      title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
    >
      {currentTheme === "dark" ? (
        <Sun className="h-4 w-4 text-accent transition-transform rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-foreground transition-transform rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
