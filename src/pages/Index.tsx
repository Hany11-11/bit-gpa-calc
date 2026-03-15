/**
 * GPA Calculator — Main page component.
 * Assembles the sticky header and active year view.
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getEffectiveGrade, YEARS } from "@/utils/constants";
import { useGPA } from "@/hooks/useGPA";
import { StatsHeader } from "@/components/StatsHeader";
import { SemesterCard } from "@/components/SemesterCard";
import { Button } from "@/components/ui/button";
import { Award, Info } from "lucide-react";

const Index = () => {
  const { grades, repeatGrades, setGrade, setRepeatGrade, resetAll, stats } =
    useGPA();
  const [showFinalPopup, setShowFinalPopup] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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

  const yearParam = searchParams.get("year");
  const parsedYear = Number(yearParam);
  const activeYear = YEARS.some((year) => year.id === parsedYear)
    ? parsedYear
    : 1;
  const activeYearData =
    YEARS.find((year) => year.id === activeYear) ?? YEARS[0];

  useEffect(() => {
    if (yearParam !== String(activeYear)) {
      setSearchParams({ year: String(activeYear) }, { replace: true });
    }
  }, [activeYear, yearParam, setSearchParams]);

  const handleExport = () => {
    window.print();
  };

  const handleSelectYear = (year: number) => {
    setSearchParams({ year: String(year) });
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const getBestAttemptGrade = (moduleId: string) => {
    const moduleType = YEARS.flatMap((year) => year.semesters)
      .flatMap((semester) => semester.modules)
      .find((module) => module.id === moduleId)?.type;

    if (!moduleType) {
      return repeatGrades[moduleId] || grades[moduleId] || "-";
    }

    return (
      getEffectiveGrade(moduleType, grades[moduleId], repeatGrades[moduleId]) ||
      "-"
    );
  };

  const printYears = YEARS.map((year) => {
    const semesters = year.semesters
      .map((semester) => {
        const modules = semester.modules.filter(
          (module) =>
            Boolean(grades[module.id]) || Boolean(repeatGrades[module.id]),
        );

        return {
          ...semester,
          modules,
        };
      })
      .filter((semester) => semester.modules.length > 0);

    return {
      ...year,
      semesters,
    };
  }).filter((year) => year.semesters.length > 0);

  const isYear3Complete = stats.yearResults[3].credits >= 30;
  const canGoPrevious = activeYear > 1;
  const canGoNext = activeYear < YEARS.length;

  return (
    <div className="min-h-screen app-atmosphere text-foreground transition-colors duration-300">
      <StatsHeader
        stats={stats}
        onReset={resetAll}
        onExport={handleExport}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
        activeYear={activeYear}
        onSelectYear={handleSelectYear}
      />

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <section className="mb-12 print:hidden">
          <div className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur md:mx-auto md:max-w-5xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Year Navigation
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-card-foreground">
                  {activeYear === 1 ? "🌱 " : activeYear === 2 ? "🚀 " : "🏁 "}
                  {activeYearData.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  View one academic year at a time. Your entered grades stay
                  saved when you switch years.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {YEARS.map((year) => (
                  <Button
                    key={year.id}
                    variant={year.id === activeYear ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => handleSelectYear(year.id)}
                    aria-pressed={year.id === activeYear}
                  >
                    {year.id === 1 ? "🌱" : year.id === 2 ? "🚀" : "🏁"}{" "}
                    {year.title}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:max-w-5xl md:mx-auto">
            {activeYearData.semesters.map((sem) => (
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

          {stats.yearRuleResults[activeYear] && (
            <div className="mt-5 rounded-xl border border-sky-200/70 bg-sky-50/80 p-4 md:max-w-5xl md:mx-auto dark:border-sky-800/60 dark:bg-sky-950/20">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-card-foreground">
                  {stats.yearRuleResults[activeYear]?.title}
                </p>
                <span
                  className={`rounded px-2 py-1 text-xs font-semibold ${stats.yearRuleResults[activeYear]?.allSatisfied ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                >
                  {stats.yearRuleResults[activeYear]?.allSatisfied
                    ? "✅ All rules satisfied"
                    : "⚠️ Rules pending"}
                </span>
              </div>

              <div className="space-y-2">
                {stats.yearRuleResults[activeYear]?.checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-card-foreground">
                        {check.label}
                      </p>
                      {check.detail && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
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

          <div className="mt-5 flex flex-col gap-3 md:mx-auto md:max-w-5xl md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 no-print">
              <Button
                variant="outline"
                onClick={() => handleSelectYear(activeYear - 1)}
                disabled={!canGoPrevious}
                className="rounded-xl"
              >
                Previous Year
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSelectYear(activeYear + 1)}
                disabled={!canGoNext}
                className="rounded-xl"
              >
                Next Year
              </Button>
            </div>

            {activeYear === 3 && (
              <div className="no-print">
                <Button
                  onClick={() => setShowFinalPopup(true)}
                  disabled={!isYear3Complete}
                  className="rounded-xl"
                >
                  <Award className="mr-2 h-4 w-4" />
                  🎯 Get Overall GPA
                </Button>
                {!isYear3Complete && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Complete all Level III GPA modules to view final GPA
                    summary.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="hidden print:block">
          <div className="mb-4 border-b border-black pb-3">
            <h1 className="text-2xl font-bold">UCSC BIT GPA Export Report</h1>
            <p className="text-sm text-muted-foreground">
              Overall GPA: {stats.overallGPA} | Class GPA: {stats.classGPA} |
              Awarded Class: {stats.degreeClass}
            </p>
          </div>

          <div className="space-y-6">
            {printYears.map((year) => (
              <div key={`print-year-${year.id}`} className="break-inside-avoid">
                <h2 className="text-xl font-bold mb-2">{year.title}</h2>
                <p className="text-sm mb-3">
                  Year GPA: {stats.yearResults[year.id].gpa}
                </p>

                <div className="space-y-4">
                  {year.semesters.map((semester) => (
                    <div
                      key={`print-sem-${semester.id}`}
                      className="border border-black/30 rounded-md p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold">
                          {semester.title}
                        </h3>
                        <span className="text-sm">
                          SGPA: {stats.semesterResults[semester.id].gpa}
                        </span>
                      </div>

                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-black/30">
                            <th className="text-left py-1 pr-2">Module</th>
                            <th className="text-left py-1 pr-2">Credits</th>
                            <th className="text-left py-1 pr-2">Type</th>
                            <th className="text-left py-1">
                              Effective Attempt
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {semester.modules.map((module) => (
                            <tr
                              key={`print-mod-${module.id}`}
                              className="border-b border-black/10"
                            >
                              <td className="py-1 pr-2">{module.name}</td>
                              <td className="py-1 pr-2">{module.credits}</td>
                              <td className="py-1 pr-2 uppercase">
                                {module.type}
                              </td>
                              <td className="py-1">
                                {getBestAttemptGrade(module.id)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {printYears.length === 0 && (
              <div className="border border-black/30 rounded-md p-3 text-sm">
                No filled module details to print yet.
              </div>
            )}

            <div className="mt-4 border-t border-black pt-4 break-inside-avoid">
              <h2 className="text-xl font-bold mb-2">Final Summary</h2>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="border border-black/30 rounded-md p-3">
                  <p className="text-xs">Overall GPA</p>
                  <p className="text-xl font-bold tabular-nums">
                    {stats.overallGPA}
                  </p>
                </div>
                <div className="border border-black/30 rounded-md p-3">
                  <p className="text-xs">Class GPA</p>
                  <p className="text-xl font-bold tabular-nums">
                    {stats.classGPA}
                  </p>
                </div>
                <div className="border border-black/30 rounded-md p-3">
                  <p className="text-xs">Awarded Class</p>
                  <p className="text-xl font-bold">{stats.degreeClass}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
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
