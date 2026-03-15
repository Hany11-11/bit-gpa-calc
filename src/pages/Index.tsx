/**
 * GPA Calculator — Main page component.
 * Assembles the sticky header and semester cards grid.
 */

import { useState, useEffect } from "react";
import { YEARS } from "@/utils/constants";
import { useGPA } from "@/hooks/useGPA";
import { StatsHeader } from "@/components/StatsHeader";
import { SemesterCard } from "@/components/SemesterCard";
import { Button } from "@/components/ui/button";
import { Award, Info } from "lucide-react";

const Index = () => {
  const { grades, repeatGrades, setGrade, setRepeatGrade, resetAll, stats } =
    useGPA();
  const [showFinalPopup, setShowFinalPopup] = useState(false);

  // Dark mode state persisted in localStorage
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bit-dark") === "true";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("bit-dark", String(isDark));
  }, [isDark]);

  const handleExport = () => {
    window.print();
  };

  const handleJumpToYear = (year: number) => {
    const section = document.getElementById(`year-section-${year}`);
    if (!section) return;

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const isYear3Complete = stats.yearResults[3].credits >= 30;

  return (
    <div className="min-h-screen app-atmosphere text-foreground transition-colors duration-300">
      <StatsHeader
        stats={stats}
        onReset={resetAll}
        onExport={handleExport}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
        onJumpToYear={handleJumpToYear}
      />

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {YEARS.map((year) => (
          <section
            key={year.id}
            id={`year-section-${year.id}`}
            className="mb-12 scroll-mt-36"
          >
            <h2 className="mb-6 text-center text-2xl font-bold tracking-tight md:mx-auto md:max-w-5xl md:text-left">
              {year.id === 1 ? "🌱 " : year.id === 2 ? "🚀 " : "🏁 "}
              {year.title}
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:max-w-5xl md:mx-auto">
              {year.semesters.map((sem) => (
                <SemesterCard
                  key={sem.id}
                  semester={sem}
                  result={stats.semesterResults[sem.id]}
                  grades={grades}
                  repeatGrades={repeatGrades}
                  onGradeChange={setGrade}
                  onRepeatGradeChange={setRepeatGrade}
                />
              ))}
            </div>

            {year.id <= 3 && stats.yearRuleResults[year.id] && (
              <div className="mt-5 rounded-xl border border-sky-200/70 bg-sky-50/80 p-4 md:max-w-5xl md:mx-auto dark:border-sky-800/60 dark:bg-sky-950/20">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="text-sm font-semibold text-card-foreground">
                    {stats.yearRuleResults[year.id]?.title}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${stats.yearRuleResults[year.id]?.allSatisfied ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                  >
                    {stats.yearRuleResults[year.id]?.allSatisfied
                      ? "✅ All rules satisfied"
                      : "⚠️ Rules pending"}
                  </span>
                </div>

                <div className="space-y-2">
                  {stats.yearRuleResults[year.id]?.checks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm text-card-foreground">
                          {check.label}
                        </p>
                        {check.detail && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {check.detail}
                          </p>
                        )}
                      </div>
                      <span
                        className={`mt-0.5 shrink-0 text-xs font-bold ${check.satisfied ? "text-success" : "text-destructive"}`}
                      >
                        {check.satisfied ? "✅ PASS" : "❌ FAIL"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 dark:border-amber-700/60 dark:bg-amber-950/25">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Disclaimer: Unofficial result for academic planning only.
                    Official results are published by UCSC on their official
                    website.
                  </p>
                </div>
              </div>
            )}

            {year.id === 3 && (
              <div className="mt-4 no-print md:mx-auto md:max-w-5xl">
                <Button
                  onClick={() => setShowFinalPopup(true)}
                  disabled={!isYear3Complete}
                  className="rounded-xl"
                >
                  <Award className="h-4 w-4 mr-2" />
                  🎯 Get Overall GPA
                </Button>
                {!isYear3Complete && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Complete all Level III GPA modules to view final GPA
                    summary.
                  </p>
                )}
              </div>
            )}
          </section>
        ))}
      </main>

      {showFinalPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-primary/10">
              <h3 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                🎉 Final GPA Summary
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3 bg-background/70">
                  <p className="text-xs text-muted-foreground">Overall GPA</p>
                  <p className="text-2xl font-black text-primary tabular-nums">
                    {stats.overallGPA}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-background/70">
                  <p className="text-xs text-muted-foreground">Class GPA</p>
                  <p className="text-2xl font-black tabular-nums">
                    {stats.classGPA}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3 bg-background/70">
                <p className="text-xs text-muted-foreground">Awarded Class</p>
                <p className="text-base font-bold mt-1">{stats.degreeClass}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-border p-3 text-center bg-background/70">
                  <p className="text-muted-foreground text-xs">Year 1 GPA</p>
                  <p className="font-bold tabular-nums">
                    {stats.yearResults[1].gpa}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center bg-background/70">
                  <p className="text-muted-foreground text-xs">Year 2 GPA</p>
                  <p className="font-bold tabular-nums">
                    {stats.yearResults[2].gpa}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center bg-background/70">
                  <p className="text-muted-foreground text-xs">Year 3 GPA</p>
                  <p className="font-bold tabular-nums">
                    {stats.yearResults[3].gpa}
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl border p-3 flex items-start gap-2 ${stats.degreeEligible ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"}`}
              >
                <Info className="h-4 w-4 mt-0.5" />
                <p className="text-sm">
                  {stats.degreeEligible
                    ? "🎓 Degree eligibility rules are satisfied."
                    : "📌 Degree eligibility rules are not yet fully satisfied."}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                ℹ️ Disclaimer: This calculator result is not an official UCSC
                result. Official GPA and class results will be published by UCSC
                on their official website .
              </p>
            </div>

            <div className="px-5 py-4 border-t border-border flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowFinalPopup(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 text-center no-print">
        <p className="text-sm md:text-base text-foreground mt-2 font-medium">
          Developed by{" "}
          <a
            href="https://hariram-portfolio-nine.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-primary hover:text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:text-emerald-700 rounded-sm px-0.5 transition-colors"
          >
            Hariram
          </a>{" "}
          (BIT Graduate 2025)
        </p>
      </footer>
    </div>
  );
};

export default Index;
