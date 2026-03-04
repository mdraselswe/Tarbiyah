"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "tarbiyah-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored === "dark" || stored === "light") return stored;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    root.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-sm shadow-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-50 active:scale-95"
      aria-label={isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
    >
      <span
        className={`relative flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
          isDark
            ? "border-emerald-500 bg-emerald-600 text-emerald-50"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
      <span className="hidden sm:inline">
        {isDark ? "ডার্ক" : "লাইট"} মোড
      </span>
      <span className="inline sm:hidden">{isDark ? "ডার্ক" : "লাইট"}</span>
    </button>
  );
}

