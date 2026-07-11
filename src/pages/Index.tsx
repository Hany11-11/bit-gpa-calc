/**
 * GPA Calculator — Main page component.
 * Layout matches reference: GPA banner → Year nav card → Semester grid.
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getEffectiveGrade, YEARS } from "@/utils/constants";
import { useGPA } from "@/hooks/useGPA";
import { StatsHeader } from "@/components/StatsHeader";
import { SemesterCard } from "@/components/SemesterCard";
import { Award, Info, ExternalLink } from "lucide-react";

/* ── GPA scale reference data ─────────────────────────────────── */
const GPA_SCALE_BANDS = [
  { range: "3.70 – 4.00", label: "First Class" },
  { range: "3.00 – 3.69", label: "Second Class (Upper)" },
  { range: "2.00 – 2.99", label: "Second Class (Lower)" },
  { range: "0.00 – 1.99", label: "Pass" },
];

/* ── Year metadata ─────────────────────────────────────────────── */
const YEAR_META = [
  {
    id: 1,
    emoji: "🌱",
    label: "Year 1",
    activeBorder: "border-violet-500",
    activeBg: "bg-violet-50 dark:bg-violet-950/30",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
  },
  {
    id: 2,
    emoji: "🚀",
    label: "Year 2",
    activeBorder: "border-violet-500",
    activeBg: "bg-violet-50 dark:bg-violet-950/30",
    iconBg: "bg-slate-100 dark:bg-slate-700",
  },
  {
    id: 3,
    emoji: "🏁",
    label: "Year 3",
    activeBorder: "border-violet-500",
    activeBg: "bg-violet-50 dark:bg-violet-950/30",
    iconBg: "bg-slate-100 dark:bg-slate-700",
  },
];

const Index = () => {
  const { grades, repeatGrades, setGrade, setRepeatGrade, resetAll, stats } = useGPA();
  const [showFinalPopup, setShowFinalPopup] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  /* Dark mode */
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

  /* Active year */
  const yearParam = searchParams.get("year");
  const parsedYear = Number(yearParam);
  const activeYear = YEARS.some((y) => y.id === parsedYear) ? parsedYear : 1;
  const activeYearData = YEARS.find((y) => y.id === activeYear) ?? YEARS[0];
  const activeYearMeta = YEAR_META.find((m) => m.id === activeYear) ?? YEAR_META[0];

  useEffect(() => {
    if (yearParam !== String(activeYear)) {
      setSearchParams({ year: String(activeYear) }, { replace: true });
    }
  }, [activeYear, yearParam, setSearchParams]);

  const handleSelectYear = (year: number) => {
    setSearchParams({ year: String(year) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExport = () => window.print();

  /* For print view */
  const getBestAttemptGrade = (moduleId: string) => {
    const moduleType = YEARS.flatMap((y) => y.semesters)
      .flatMap((s) => s.modules)
      .find((m) => m.id === moduleId)?.type;
    if (!moduleType) return repeatGrades[moduleId] || grades[moduleId] || "-";
    return getEffectiveGrade(moduleType, grades[moduleId], repeatGrades[moduleId]) || "-";
  };

  const printYears = YEARS.map((year) => ({
    ...year,
    semesters: year.semesters
      .map((sem) => ({
        ...sem,
        modules: sem.modules.filter(
          (m) => Boolean(grades[m.id]) || Boolean(repeatGrades[m.id]),
        ),
      }))
      .filter((sem) => sem.modules.length > 0),
  })).filter((year) => year.semesters.length > 0);

  const isYear3Complete = stats.yearResults[3].credits >= 30;
  const yearRuleResult = stats.yearRuleResults[activeYear];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-foreground transition-colors duration-300">

      {/* ── Top navigation bar ── */}
      <StatsHeader
        stats={stats}
        onReset={resetAll}
        onExport={handleExport}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
        activeYear={activeYear}
        onSelectYear={handleSelectYear}
      />

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5 print:hidden">
        {/* SEO H1 */}
        <h1 className="sr-only">UCSC BIT GPA Calculator - Bachelor of Information Technology</h1>

        {/* ── Unified GPA & Navigation Card ────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Top Row: GPA Info & Scale */}
          <div className="bg-gradient-to-r from-[#3b3fc7] to-[#6d5ee0] flex flex-col md:flex-row items-stretch divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="flex items-center gap-6 px-6 py-5 flex-[2]">
              <div className="shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Current GPA</p>
                <p className="text-5xl font-black tabular-nums leading-none text-white">{stats.classGPA}</p>
              </div>
              <div className="w-px h-12 bg-white/15 hidden sm:block" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">Awarded Class</p>
                    <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-1"><span>🥇</span>{stats.degreeClass}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-0.5">
                    <span className="text-[11px] font-semibold text-white">{stats.degreeEligible ? "Eligible" : "Not classified"}</span>
                    <Info className="h-2.5 w-2.5 text-white/60" />
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden max-w-[180px]">
                    <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${stats.completionPercent}%` }} />
                  </div>
                  <span className="text-[11px] text-white/60 tabular-nums">{stats.completionPercent}%</span>
                </div>
              </div>
            </div>
            <div className="flex-[3] px-6 py-5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-3">GPA Scale (UCSC)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                {GPA_SCALE_BANDS.map((band) => (
                  <div key={band.range}>
                    <p className="text-sm font-bold text-white tabular-nums leading-tight">{band.range}</p>
                    <p className="text-[11px] text-white/55 mt-0.5 leading-tight">{band.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Year Navigator */}
          <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-t border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-xl`}>
                {activeYearMeta.emoji}
              </div>
              <div className="text-slate-900 dark:text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Currently Viewing</p>
                <p className="text-lg font-black mt-0.5">{activeYearData.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Grades are saved automatically when you switch years.</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              {YEAR_META.map((meta) => {
                const isActive = meta.id === activeYear;
                return (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => handleSelectYear(meta.id)}
                    aria-pressed={isActive}
                    aria-label={`Switch to ${meta.label}`}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                      isActive ? "bg-indigo-600 text-white shadow-md border border-indigo-500" : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Semester Cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

        {/* ── Year Rule Results ────────────────────────────── */}
        {yearRuleResult && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Year Progress Check
                </p>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {yearRuleResult.title}
                </h2>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  yearRuleResult.allSatisfied
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50"
                }`}
              >
                {yearRuleResult.allSatisfied ? "✅ All Rules Satisfied" : "⚠️ Rules Pending"}
              </span>
            </div>

            {/* GPA grid */}
            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Overall GPA</p>
                <p className="text-2xl font-black tabular-nums text-slate-900 dark:text-white mt-1">
                  {yearRuleResult.overallGpa}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class GPA</p>
                <p className="text-2xl font-black tabular-nums text-slate-900 dark:text-white mt-1">
                  {yearRuleResult.classGpa}
                </p>
              </div>
            </div>

            {/* Rule checks */}
            <div className="px-6 pb-5 space-y-2">
              {yearRuleResult.checks.map((check) => (
                <div
                  key={check.id}
                  className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 ${
                    check.satisfied
                      ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                      : "border-red-100 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{check.label}</p>
                    {check.detail && (
                      <p className="mt-0.5 text-xs text-slate-500">{check.detail}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-xs font-black mt-0.5 ${
                      check.satisfied ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                    }`}
                  >
                    {check.satisfied ? "PASS ✓" : "FAIL ✗"}
                  </span>
                </div>
              ))}

              {/* Disclaimer */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 px-3.5 py-2.5 mt-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  ⚠️ Unofficial result for academic planning only. Official results are published by UCSC on their official website.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom actions ───────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectYear(activeYear - 1)}
              disabled={activeYear <= 1}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous Year
            </button>
            <button
              onClick={() => handleSelectYear(activeYear + 1)}
              disabled={activeYear >= YEARS.length}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next Year →
            </button>
          </div>

          {activeYear === 3 && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => setShowFinalPopup(true)}
                disabled={!isYear3Complete}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:shadow-violet-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Award className="h-4 w-4" />
                🎯 Get Overall GPA
              </button>
              {!isYear3Complete && (
                <p className="text-xs text-slate-400">
                  Complete all Level III GPA modules to view.
                </p>
              )}
            </div>
          )}
        </div>

      </main>

      {/* ── Print view ───────────────────────────────────── */}
      <section className="hidden print:block px-8 py-6">
        <div className="mb-4 border-b border-black pb-3">
          <h1 className="text-2xl font-bold">UCSC BIT GPA Export Report</h1>
          <p className="text-sm">
            Overall GPA: {stats.overallGPA} | Class GPA: {stats.classGPA} | Class: {stats.degreeClass}
          </p>
        </div>
        <div className="space-y-6">
          {printYears.map((year) => (
            <div key={`py-${year.id}`} className="break-inside-avoid">
              <h2 className="text-xl font-bold mb-2">{year.title}</h2>
              <p className="text-sm mb-3">Year GPA: {stats.yearResults[year.id].gpa}</p>
              {year.semesters.map((sem) => (
                <div key={`ps-${sem.id}`} className="border border-black/30 rounded-md p-3 mb-4">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">{sem.title}</h3>
                    <span className="text-sm">SGPA: {stats.semesterResults[sem.id].gpa}</span>
                  </div>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-black/30">
                        <th className="text-left py-1 pr-2">Module</th>
                        <th className="text-left py-1 pr-2">Credits</th>
                        <th className="text-left py-1 pr-2">Type</th>
                        <th className="text-left py-1">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.modules.map((mod) => (
                        <tr key={`pm-${mod.id}`} className="border-b border-black/10">
                          <td className="py-1 pr-2">{mod.name}</td>
                          <td className="py-1 pr-2">{mod.credits}</td>
                          <td className="py-1 pr-2 uppercase">{mod.type}</td>
                          <td className="py-1">{getBestAttemptGrade(mod.id)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
          {printYears.length === 0 && (
            <p className="text-sm text-slate-500">No grades entered yet.</p>
          )}
          <div className="border-t border-black pt-4 break-inside-avoid">
            <h2 className="text-xl font-bold mb-2">Final Summary</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="border border-black/30 rounded-md p-3">
                <p className="text-xs">Overall GPA</p>
                <p className="text-xl font-bold tabular-nums">{stats.overallGPA}</p>
              </div>
              <div className="border border-black/30 rounded-md p-3">
                <p className="text-xs">Class GPA</p>
                <p className="text-xl font-bold tabular-nums">{stats.classGPA}</p>
              </div>
              <div className="border border-black/30 rounded-md p-3">
                <p className="text-xs">Awarded Class</p>
                <p className="text-xl font-bold">{stats.degreeClass}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final GPA Modal ───────────────────────────────── */}
      {showFinalPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setShowFinalPopup(false); }}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 pt-6 pb-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                    Final Summary
                  </p>
                  <h3 className="text-lg font-black text-white">🎉 Congratulations!</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-white/15 rounded-2xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Overall GPA</p>
                  <p className="text-3xl font-black tabular-nums text-white mt-1">{stats.overallGPA}</p>
                </div>
                <div className="bg-white/15 rounded-2xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Class GPA</p>
                  <p className="text-3xl font-black tabular-nums text-white mt-1">{stats.classGPA}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Awarded class */}
              <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/20 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-violet-500">🏅 Awarded Class</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{stats.degreeClass}</p>
              </div>

              {/* Year GPAs */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((y) => (
                  <div key={y} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 px-3 py-2.5 text-center">
                    <p className="text-lg">{YEAR_META[y - 1].emoji}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Year {y}</p>
                    <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{stats.yearResults[y].gpa}</p>
                  </div>
                ))}
              </div>

              {/* Eligibility */}
              <div
                className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${
                  stats.degreeEligible
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20"
                    : "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20"
                }`}
              >
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {stats.degreeEligible
                    ? "🎓 Degree eligibility rules are satisfied."
                    : "📌 Degree eligibility rules are not yet fully satisfied."}
                </p>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                ℹ️ Unofficial result for academic planning only. Official GPA results will be published by UCSC on their official website.
              </p>
            </div>

            <div className="px-6 pb-5 flex gap-2 justify-end">
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Export PDF
              </button>
              <button
                onClick={() => setShowFinalPopup(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:shadow-md hover:shadow-violet-500/25 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="max-w-7xl mx-auto px-6 py-6 no-print">
        <div className="h-px bg-slate-200 dark:bg-slate-700 mb-5" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">UCSC BIT GPA Calculator · Academic Year 2024</p>
          <a
            href="https://hariram-portfolio-nine.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            Developed by Hariram
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </footer>

    </div>
  );
};

export default Index;
