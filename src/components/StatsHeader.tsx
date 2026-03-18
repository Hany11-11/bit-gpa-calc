/**
 * StatsHeader — Sticky header showing overall GPA, year GPAs, and progress.
 */

import type { GPAStats } from "@/hooks/useGPA";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { FileDown, Moon, RotateCcw, Sun } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";

interface StatsHeaderProps {
  stats: GPAStats;
  onReset: () => void;
  onExport: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  activeYear: number;
  onSelectYear: (year: number) => void;
}

export function StatsHeader({
  stats,
  onReset,
  onExport,
  isDark,
  onToggleDark,
  activeYear,
  onSelectYear,
}: StatsHeaderProps) {
  const [pop, setPop] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileCompact, setIsMobileCompact] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const prevGPA = useRef(stats.classGPA);

  // Trigger pop animation when the visible headline GPA changes.
  useEffect(() => {
    if (prevGPA.current !== stats.classGPA) {
      setPop(true);
      prevGPA.current = stats.classGPA;
      const t = setTimeout(() => setPop(false), 300);
      return () => clearTimeout(t);
    }
  }, [stats.classGPA]);

  useEffect(() => {
    const updateMobileState = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    updateMobileState();
    window.addEventListener("resize", updateMobileState);

    return () => {
      window.removeEventListener("resize", updateMobileState);
    };
  }, []);

  useEffect(() => {
    if (!isMobileView) {
      setIsMobileCompact(false);
      setIsMobileExpanded(false);
      return;
    }

    const onScroll = () => {
      const compact = window.scrollY > 40;
      setIsMobileCompact(compact);
      if (!compact) {
        setIsMobileExpanded(false);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [isMobileView]);

  const showCompactBar = isMobileView && isMobileCompact && !isMobileExpanded;

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <Card className="overflow-hidden">

          {/* ── Compact bar (mobile, scrolled) ── */}
          <div
            className="transition-all duration-300 ease-in-out overflow-hidden"
            style={{
              maxHeight: showCompactBar ? "80px" : "0px",
              opacity: showCompactBar ? 1 : 0,
              pointerEvents: showCompactBar ? "auto" : "none",
            }}
          >
            <div className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Class GPA
                </p>
                <p className="text-2xl font-semibold tabular-nums text-primary leading-none">
                  {stats.classGPA}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileExpanded(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent transition-colors"
              >
                Expand
              </button>
            </div>
          </div>

          {/* ── Full header panel ── */}
          <div
            className="transition-all duration-300 ease-in-out overflow-hidden"
            style={{
              maxHeight: showCompactBar ? "0px" : "1000px",
              opacity: showCompactBar ? 0 : 1,
              pointerEvents: showCompactBar ? "none" : "auto",
            }}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 gap-6">
              {/* Left side: Main GPA and Progress */}
              <div className="w-full lg:w-1/2 min-w-0">
                <CardHeader className="p-0">
                  <CardDescription>🎓 UCSC BIT — Class GPA</CardDescription>
                  <div className="mt-1 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                    <CardTitle
                      className={`text-5xl font-semibold tabular-nums tracking-tight text-primary leading-none ${pop ? "gpa-pop" : ""}`}
                    >
                      {stats.classGPA}
                    </CardTitle>
                    <div className="inline-flex max-w-full items-center rounded-lg bg-secondary/50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          🏅 Awarded Class
                        </p>
                        <p className="text-sm font-bold text-card-foreground truncate">
                          {stats.degreeClass}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Exact overall GPA is shown after you click Get Overall GPA.
                  </p>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={stats.completionPercent}
                      className="h-1.5"
                      aria-label={`${stats.completionPercent}% of modules completed`}
                    />
                    <span className="text-xs font-bold tabular-nums text-muted-foreground">
                      {stats.completionPercent}%
                    </span>
                  </div>
                </CardContent>
              </div>

              {/* Right side: Year GPAs and Actions */}
              <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center lg:w-auto">
                <div className="grid grid-cols-3 gap-3 sm:gap-4 flex-1">
                  {[1, 2, 3].map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => onSelectYear(year)}
                      className={`rounded-lg p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${activeYear === year ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/50 hover:bg-secondary"}`}
                      aria-label={`View Year ${year}`}
                      aria-pressed={activeYear === year}
                    >
                      <p
                        className={`text-xs ${activeYear === year ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                      >
                        {year === 1 ? "🌱" : year === 2 ? "🚀" : "🏁"} Year{" "}
                        {year}
                      </p>
                      <p className="text-2xl font-bold tabular-nums">
                        {stats.yearResults[year].classGPA}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                  {isMobileView && isMobileCompact && (
                    <Button
                      variant="outline"
                      onClick={() => setIsMobileExpanded(false)}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Collapse
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={onExport}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onReset}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size={isMobileView ? "sm" : "icon"}
                    onClick={onToggleDark}
                    title="Toggle dark mode"
                    className="w-full sm:w-auto"
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    {isMobileView && <span>Theme</span>}
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </Card>
      </div>
    </header>
  );
}
