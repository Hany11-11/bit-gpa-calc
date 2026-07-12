/**
 * StatsHeader — Top navigation bar.
 * Greeting, year tab switcher, and action buttons.
 */

import type { GPAStats } from "@/hooks/useGPA";
import { useEffect, useState } from "react";
import { FileDown, Moon, RotateCcw, Sun } from "lucide-react";

interface StatsHeaderProps {
  stats: GPAStats;
  onReset: () => void;
  onExport: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  activeYear: number;
  onSelectYear: (year: number) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function StatsHeader({
  onReset,
  onExport,
  isDark,
  onToggleDark,
  activeYear,
  onSelectYear,
}: StatsHeaderProps) {
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const t = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4">

        {/* Greeting */}
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
            {greeting}, Student!
            <span role="img" aria-label="wave">👋</span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight hidden sm:block">
            Track your academic performance and achieve your goals.
          </p>
        </div>

        {/* Year tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg sm:rounded-xl p-0.5 sm:p-1 gap-0.5 shrink-0">
          {[1, 2, 3].map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => onSelectYear(year)}
              aria-pressed={activeYear === year}
              aria-label={`Switch to Year ${year}`}
              className={`px-3 sm:px-5 py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
                activeYear === year
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Y{year}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
            title="Export as PDF"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95"
            title="Reset all grades"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center"
          >
            {isDark
              ? <Sun className="h-4 w-4 text-amber-400" />
              : <Moon className="h-4 w-4 text-slate-500" />
            }
          </button>
        </div>

      </div>
    </header>
  );
}
