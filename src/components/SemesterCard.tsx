/**
 * SemesterCard — Displays a semester's modules with its SGPA.
 */

import { useEffect, useRef } from "react";
import type { Semester } from "@/utils/constants";
import type { SemesterResult } from "@/hooks/useGPA";
import { ModuleRow } from "./ModuleRow";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle } from "lucide-react";
import { GRADE_SCALE } from "@/utils/constants";
import { toast } from "./ui/sonner";

interface SemesterCardProps {
  semester: Semester;
  result: SemesterResult;
  grades: Record<string, string>;
  repeatGrades: Record<string, string>;
  onGradeChange: (moduleId: string, grade: string) => void;
  onRepeatGradeChange: (moduleId: string, grade: string) => void;
}

export function SemesterCard({
  semester,
  result,
  grades,
  repeatGrades,
  onGradeChange,
  onRepeatGradeChange,
}: SemesterCardProps) {
  const previousIneligibleCountRef = useRef(0);

  const ineligibleCount = semester.modules.filter((mod) => {
    const grade = grades[mod.id];
    if (!grade) return false;

    if (mod.type === "non-gpa") {
      return grade === "Fail" || grade === "Not Sit";
    }

    if (grade === "Not Sit") return true;

    const points = GRADE_SCALE[grade];
    return points !== null && points !== undefined && points < GRADE_SCALE.D;
  }).length;

  const hasIneligibleGrade = ineligibleCount > 0;

  useEffect(() => {
    if (ineligibleCount > previousIneligibleCountRef.current) {
      toast.error("Not eligible for next year", {
        description: "You are not eligible for next year. You must re-sit.",
        duration: 5000,
      });
    }

    previousIneligibleCountRef.current = ineligibleCount;
  }, [ineligibleCount]);

  return (
    <section className="bg-card rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-3 border-b border-border">
        <div>
          <h2 className="font-bold text-base tracking-tight text-card-foreground">
            {semester.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {result.modulesCompleted}/{result.totalGpaModules} modules graded
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            SGPA
          </span>
          <p className="text-xl font-black tabular-nums text-primary leading-tight">
            {result.gpa}
          </p>
        </div>
      </div>

      {/* Module list */}
      <div className="divide-y divide-border/50">
        {semester.modules.map((mod) => (
          <ModuleRow
            key={mod.id}
            id={mod.id}
            name={mod.name}
            type={mod.type}
            grade={grades[mod.id] || ""}
            repeatGrade={repeatGrades[mod.id] || ""}
            onGradeChange={onGradeChange}
            onRepeatGradeChange={onRepeatGradeChange}
          />
        ))}
      </div>

      {hasIneligibleGrade && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not eligible for next year</AlertTitle>
          <AlertDescription>
            You are not eligible for next year. You must re-sit.
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}
