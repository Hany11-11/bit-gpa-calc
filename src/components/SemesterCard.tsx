/**
 * SemesterCard — Flat white card matching the reference design.
 * Colored dot header, module progress, and inline module list.
 */

import { useEffect, useRef } from "react";
import type { Semester } from "@/utils/constants";
import type { SemesterResult } from "@/hooks/useGPA";
import { ModuleRow } from "./ModuleRow";
import { AlertTriangle } from "lucide-react";
import {
  countsForGPA,
  getEffectiveGrade,
  GRADE_SCALE,
} from "@/utils/constants";
import { toast } from "./ui/sonner";

interface SemesterCardProps {
  semester: Semester;
  result: SemesterResult;
  grades: Record<string, string>;
  repeatGrades: Record<string, string>;
  onGradeChange: (moduleId: string, grade: string) => void;
  onRepeatGradeChange: (moduleId: string, grade: string) => void;
}

const SEMESTER_STYLES: Record<
  number,
  { dot: string; sgpaColor: string; headerBorder: string }
> = {
  1: {
    dot: "bg-indigo-500",
    sgpaColor: "text-indigo-600 dark:text-indigo-400",
    headerBorder: "border-indigo-100 dark:border-indigo-900/40",
  },
  2: {
    dot: "bg-emerald-500",
    sgpaColor: "text-emerald-600 dark:text-emerald-400",
    headerBorder: "border-emerald-100 dark:border-emerald-900/40",
  },
  3: {
    dot: "bg-amber-500",
    sgpaColor: "text-amber-600 dark:text-amber-400",
    headerBorder: "border-amber-100 dark:border-amber-900/40",
  },
  4: {
    dot: "bg-rose-500",
    sgpaColor: "text-rose-600 dark:text-rose-400",
    headerBorder: "border-rose-100 dark:border-rose-900/40",
  },
  5: {
    dot: "bg-violet-500",
    sgpaColor: "text-violet-600 dark:text-violet-400",
    headerBorder: "border-violet-100 dark:border-violet-900/40",
  },
  6: {
    dot: "bg-cyan-500",
    sgpaColor: "text-cyan-600 dark:text-cyan-400",
    headerBorder: "border-cyan-100 dark:border-cyan-900/40",
  },
};

export function SemesterCard({
  semester,
  result,
  grades,
  repeatGrades,
  onGradeChange,
  onRepeatGradeChange,
}: SemesterCardProps) {
  const style = SEMESTER_STYLES[semester.id] ?? SEMESTER_STYLES[1];
  const previousIneligibleCountRef = useRef(0);

  const ineligibleCount = semester.modules.filter((mod) => {
    const grade = getEffectiveGrade(mod.type, grades[mod.id], repeatGrades[mod.id]);
    if (!grade) return false;
    if (mod.type === "non-gpa") return grade === "Fail" || grade === "Not Sit";
    if (!countsForGPA(mod.type)) return false;
    if (grade === "Not Sit") return true;
    const points = GRADE_SCALE[grade];
    return points !== null && points !== undefined && points < GRADE_SCALE.D;
  }).length;

  useEffect(() => {
    if (ineligibleCount > previousIneligibleCountRef.current) {
      toast.error("Not eligible for next year", {
        description: "You must re-sit the failed module(s).",
        duration: 5000,
      });
    }
    previousIneligibleCountRef.current = ineligibleCount;
  }, [ineligibleCount]);

  // Right label: show "X/N SGPA" when no grades, show "GPA SGPA" when calculated
  const sgpaLabel =
    result.classGPA !== "—"
      ? `${result.classGPA} SGPA`
      : `${result.modulesCompleted} / ${result.totalGpaModules} SGPA`;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-3 sm:px-5 py-3 sm:py-3.5 border-b ${style.headerBorder} border-slate-100 dark:border-slate-700/60`}>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${style.dot} shrink-0`} />
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
            {semester.title}
          </h2>
        </div>
        <span className={`text-[11px] sm:text-xs font-bold ${style.sgpaColor}`}>
          {sgpaLabel}
        </span>
      </div>

      {/* Module rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {semester.modules.map((mod) => (
          <ModuleRow
            key={mod.id}
            id={mod.id}
            name={mod.name}
            type={mod.type}
            credits={mod.credits}
            grade={grades[mod.id] || ""}
            repeatGrade={repeatGrades[mod.id] || ""}
            onGradeChange={onGradeChange}
            onRepeatGradeChange={onRepeatGradeChange}
          />
        ))}
      </div>

      {/* Ineligible warning */}
      {ineligibleCount > 0 && (
        <div className="mx-3 sm:mx-4 mb-3 mt-2 flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-2.5 sm:px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[11px] sm:text-xs font-medium text-red-600 dark:text-red-400">
            Not eligible for next year — you must re-sit the failed module(s).
          </p>
        </div>
      )}
    </section>
  );
}
