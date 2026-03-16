/**
 * useGPA Hook — Core calculation engine for the BIT GPA Calculator.
 * Manages grade state and computes semester, year, and overall GPAs reactively.
 */

import { useState, useMemo, useCallback } from "react";
import {
  countsForGPA,
  getEffectiveGrade,
  GRADE_SCALE,
  SEMESTERS,
  YEARS,
  type ModuleType,
} from "@/utils/constants";

export interface SemesterResult {
  gpa: string;
  classGPA: string;
  credits: number;
  modulesCompleted: number;
  totalGpaModules: number;
}

export interface YearResult {
  gpa: string;
  classGPA: string;
  credits: number;
}

export interface GPAStats {
  overallGPA: string;
  totalCredits: number;
  semesterResults: Record<number, SemesterResult>;
  yearResults: Record<number, YearResult>;
  completedModules: number;
  totalGpaModules: number;
  completionPercent: number;
  yearRuleResults: Record<number, YearRuleResult | null>;
  degreeEligible: boolean;
  degreeClass: string;
  classGPA: string;
}

export interface RuleCheckResult {
  id: string;
  label: string;
  satisfied: boolean;
  detail?: string;
}

export interface YearRuleResult {
  title: string;
  allSatisfied: boolean;
  checks: RuleCheckResult[];
  overallGpa: string;
  classGpa: string;
}

export function useGPA() {
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [repeatGrades, setRepeatGrades] = useState<Record<string, string>>({});

  const setGrade = useCallback((moduleId: string, grade: string) => {
    setGrades((prev) => ({ ...prev, [moduleId]: grade }));
  }, []);

  const setRepeatGrade = useCallback((moduleId: string, grade: string) => {
    setRepeatGrades((prev) => ({ ...prev, [moduleId]: grade }));
  }, []);

  const resetAll = useCallback(() => {
    setGrades({});
    setRepeatGrades({});
  }, []);

  const stats: GPAStats = useMemo(() => {
    const getOverallGrade = (moduleId: string) =>
      getEffectiveGrade(
        YEARS.flatMap((year) => year.semesters)
          .flatMap((semester) => semester.modules)
          .find((module) => module.id === moduleId)?.type ?? "gpa",
        grades[moduleId],
        repeatGrades[moduleId],
      );

    const getOverallPoint = (moduleId: string) => {
      const grade = getOverallGrade(moduleId);
      if (!grade || grade === "Not Sit") return null;
      const point = GRADE_SCALE[grade];
      return point ?? null;
    };

    const getClassPoint = (moduleId: string) => {
      const overallPoint = getOverallPoint(moduleId);
      if (overallPoint === null || overallPoint === undefined) return null;

      const hasRepeat = Boolean(repeatGrades[moduleId]);
      if (hasRepeat && overallPoint > GRADE_SCALE.C) {
        return GRADE_SCALE.C;
      }

      return overallPoint;
    };

    const level3OptionalIds = new Set(
      (YEARS.find((y) => y.id === 3)?.semesters.flatMap((s) => s.modules) ?? [])
        .filter((m) => m.type === "optional")
        .map((m) => m.id),
    );

    const optionalCandidates = Array.from(level3OptionalIds)
      .map((id) => {
        const point = getOverallPoint(id);
        const credits =
          YEARS.find((y) => y.id === 3)
            ?.semesters.flatMap((s) => s.modules)
            .find((m) => m.id === id)?.credits ?? 0;
        return { id, point, credits };
      })
      .filter((o) => o.point !== null)
      .sort((a, b) => {
        if ((b.point as number) !== (a.point as number)) {
          return (b.point as number) - (a.point as number);
        }
        return b.credits - a.credits;
      });

    const selectedLevel3OptionalId = optionalCandidates[0]?.id ?? null;

    const moduleCountsForProgramGPA = (moduleId: string, type: ModuleType) => {
      if (!countsForGPA(type)) return false;
      if (type !== "optional") return true;
      if (!level3OptionalIds.has(moduleId)) return true;
      return moduleId === selectedLevel3OptionalId;
    };

    let totalPoints = 0;
    let totalCredits = 0;
    let completedModules = 0;
    const semesterResults: Record<number, SemesterResult> = {};

    const requiredOptionalCount = level3OptionalIds.size > 0 ? 1 : 0;
    const requiredTotalGpaModules =
      SEMESTERS.reduce(
        (acc, sem) => acc + sem.modules.filter((m) => m.type === "gpa").length,
        0,
      ) + requiredOptionalCount;

    SEMESTERS.forEach((sem) => {
      let semPoints = 0;
      let semClassPoints = 0;
      let semCredits = 0;
      let semCompleted = 0;
      const totalGpaModules = sem.modules.filter((m) =>
        moduleCountsForProgramGPA(m.id, m.type),
      ).length;

      sem.modules.forEach((mod) => {
        const grade = getOverallGrade(mod.id);
        // Skip modules that do not contribute to GPA.
        if (!moduleCountsForProgramGPA(mod.id, mod.type)) return;
        // Skip if no grade selected or "Not Sit"
        if (!grade || grade === "Not Sit") return;

        const point = getOverallPoint(mod.id);
        if (point !== null && point !== undefined) {
          semPoints += point * mod.credits;
          semClassPoints += (getClassPoint(mod.id) ?? point) * mod.credits;
          semCredits += mod.credits;
          semCompleted++;
          completedModules++;
        }
      });

      const gpa = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : "—";
      const classGPA =
        semCredits > 0 ? (semClassPoints / semCredits).toFixed(2) : "—";
      semesterResults[sem.id] = {
        gpa,
        classGPA,
        credits: semCredits,
        modulesCompleted: semCompleted,
        totalGpaModules,
      };

      totalPoints += semPoints;
      totalCredits += semCredits;
    });

    // Year results: combine semester pairs
    const yearResults: Record<number, YearResult> = {};
    for (let year = 1; year <= 3; year++) {
      const s1 = semesterResults[year * 2 - 1];
      const s2 = semesterResults[year * 2];
      const yCreds = s1.credits + s2.credits;
      // Recalculate from raw points
      let yPoints = 0;
      let yClassPoints = 0;
      [year * 2 - 1, year * 2].forEach((semId) => {
        const sem = SEMESTERS.find((s) => s.id === semId)!;
        sem.modules.forEach((mod) => {
          const grade = getOverallGrade(mod.id);
          if (
            !moduleCountsForProgramGPA(mod.id, mod.type) ||
            !grade ||
            grade === "Not Sit"
          )
            return;
          const point = getOverallPoint(mod.id);
          if (point !== null && point !== undefined) {
            yPoints += point * mod.credits;
            yClassPoints += (getClassPoint(mod.id) ?? point) * mod.credits;
          }
        });
      });
      yearResults[year] = {
        gpa: yCreds > 0 ? (yPoints / yCreds).toFixed(2) : "—",
        classGPA: yCreds > 0 ? (yClassPoints / yCreds).toFixed(2) : "—",
        credits: yCreds,
      };
    }

    const yearRuleResults: Record<number, YearRuleResult | null> = {
      1: null,
      2: null,
      3: null,
    };
    const buildProgressionRules = (
      yearId: number,
      title: string,
      levelLabel: string,
    ): YearRuleResult => {
      const modules =
        YEARS.find((y) => y.id === yearId)?.semesters.flatMap(
          (s) => s.modules,
        ) ?? [];
      const gpaModules = modules.filter((m) =>
        moduleCountsForProgramGPA(m.id, m.type),
      );
      const enhancementModules = modules.filter((m) => m.type === "non-gpa");

      let points = 0;
      let classPoints = 0;
      let credits = 0;
      let classCredits = 0;
      let creditsWithPointAtLeastTwo = 0;

      gpaModules.forEach((mod) => {
        const grade = getOverallGrade(mod.id);
        if (!grade || grade === "Not Sit") return;
        const point = getOverallPoint(mod.id);
        if (point === null || point === undefined) return;

        points += point * mod.credits;
        credits += mod.credits;

        const classPoint = getClassPoint(mod.id);
        if (classPoint !== null && classPoint !== undefined) {
          classPoints += classPoint * mod.credits;
          classCredits += mod.credits;
        }

        if (point >= 2) {
          creditsWithPointAtLeastTwo += mod.credits;
        }
      });

      const gpa = credits > 0 ? points / credits : 0;
      const classGpa = classCredits > 0 ? classPoints / classCredits : 0;

      const rule1 = gpa >= 2;
      const rule2 = creditsWithPointAtLeastTwo >= 20;
      const rule3 =
        enhancementModules.length === 0 ||
        enhancementModules.every((mod) => grades[mod.id] === "Pass");
      const rule4 = gpaModules.every((mod) => {
        const grade = getOverallGrade(mod.id);
        if (!grade || grade === "Not Sit") return false;
        const point = getOverallPoint(mod.id);
        return point !== null && point !== undefined && point >= 1;
      });

      const checks: RuleCheckResult[] = [
        {
          id: `y${yearId}-min-gpa`,
          label: "Minimum GPA of 2.00",
          satisfied: rule1,
          detail: `Current: ${credits > 0 ? gpa.toFixed(2) : "—"}`,
        },
        {
          id: `y${yearId}-credits-at-least-2`,
          label: "Grade point 2.00 or above in at least 20 GPA credits",
          satisfied: rule2,
          detail: `Current: ${creditsWithPointAtLeastTwo}/20 credits`,
        },
        {
          id: `y${yearId}-enhancement-pass`,
          label: "Pass grade for all enhancement courses",
          satisfied: rule3,
        },
        {
          id: `y${yearId}-no-below-1`,
          label: `No grade point below 1.00 in any ${levelLabel} GPA course`,
          satisfied: rule4,
        },
      ];

      return {
        title,
        allSatisfied: checks.every((c) => c.satisfied),
        checks,
        overallGpa: gpa > 0 ? gpa.toFixed(2) : "—",
        classGpa: classGpa > 0 ? classGpa.toFixed(2) : "—",
      };
    };

    yearRuleResults[1] = buildProgressionRules(
      1,
      "Level I -> Level II progression rules",
      "Level I",
    );

    yearRuleResults[2] = buildProgressionRules(
      2,
      "Level II -> Level III progression rules",
      "Level II",
    );

    const levelModules = (level: number) =>
      YEARS.find((y) => y.id === level)?.semesters.flatMap((s) => s.modules) ??
      [];

    const levelGpaCredits = (level: number) => {
      const modules = levelModules(level).filter((m) => m.credits > 0);
      return modules.reduce((sum, mod) => {
        if (mod.type === "non-gpa") {
          return getOverallGrade(mod.id) === "Pass" ? sum + mod.credits : sum;
        }

        if (!countsForGPA(mod.type)) {
          return sum;
        }

        const effectiveGrade = getEffectiveGrade(
          mod.type,
          grades[mod.id],
          repeatGrades[mod.id],
        );
        const effectivePoint = GRADE_SCALE[effectiveGrade];
        if (
          effectivePoint === null ||
          effectivePoint === undefined ||
          effectivePoint < GRADE_SCALE.D
        ) {
          return sum;
        }

        return sum + mod.credits;
      }, 0);
    };

    const levelCreditsAtLeastC = (level: number) => {
      const modules = levelModules(level).filter((m) =>
        moduleCountsForProgramGPA(m.id, m.type),
      );
      return modules.reduce((sum, mod) => {
        const grade = getOverallGrade(mod.id);
        if (!grade || grade === "Not Sit") return sum;
        const point = getOverallPoint(mod.id);
        if (point === null || point === undefined || point < GRADE_SCALE.C) {
          return sum;
        }
        return sum + mod.credits;
      }, 0);
    };

    const levelEnhancementPass = (level: number) => {
      const modules = levelModules(level).filter((m) => m.type === "non-gpa");
      if (modules.length === 0) return true;
      return modules.every((m) => getOverallGrade(m.id) === "Pass");
    };

    const levelNoBelowD = (level: number) => {
      const modules = levelModules(level).filter((m) =>
        moduleCountsForProgramGPA(m.id, m.type),
      );
      return modules.every((mod) => {
        const grade = getOverallGrade(mod.id);
        if (!grade || grade === "Not Sit") return false;
        const point = getOverallPoint(mod.id);
        return point !== null && point !== undefined && point >= 1;
      });
    };

    const level1GpaCredits = levelGpaCredits(1);
    const level2GpaCredits = levelGpaCredits(2);
    const level3GpaCredits = levelGpaCredits(3);
    const totalGpaCreditsAllLevels =
      level1GpaCredits + level2GpaCredits + level3GpaCredits;

    const overallGpaValue = totalCredits > 0 ? totalPoints / totalCredits : 0;

    let classTotalPoints = 0;
    let classTotalCredits = 0;
    SEMESTERS.forEach((sem) => {
      sem.modules.forEach((mod) => {
        if (!moduleCountsForProgramGPA(mod.id, mod.type)) return;
        const point = getClassPoint(mod.id);
        if (point === null || point === undefined) return;
        classTotalPoints += point * mod.credits;
        classTotalCredits += mod.credits;
      });
    });
    const classGpaValue =
      classTotalCredits > 0 ? classTotalPoints / classTotalCredits : 0;

    const level1CreditsAtLeastC = levelCreditsAtLeastC(1);
    const level2CreditsAtLeastC = levelCreditsAtLeastC(2);
    const level3CreditsAtLeastC = levelCreditsAtLeastC(3);

    const sdpGrade = getOverallGrade("IT5106");
    const sdpPoint = getOverallPoint("IT5106");

    const degreeChecks: RuleCheckResult[] = [
      {
        id: "y3-degree-min-credits",
        label:
          "Minimum 90 GPA credits with at least 30 GPA credits from each level",
        satisfied:
          totalGpaCreditsAllLevels >= 90 &&
          level1GpaCredits >= 30 &&
          level2GpaCredits >= 30 &&
          level3GpaCredits >= 30,
        detail: `Earned credits: L1 ${level1GpaCredits}, L2 ${level2GpaCredits}, L3 ${level3GpaCredits}, Total ${totalGpaCreditsAllLevels}`,
      },
      {
        id: "y3-degree-overall-gpa",
        label: "Minimum overall GPA of 2.00 in all levels",
        satisfied: overallGpaValue >= 2,
        detail: `Current: ${totalCredits > 0 ? overallGpaValue.toFixed(2) : "—"}`,
      },
      {
        id: "y3-degree-c-credits-each-level",
        label:
          'Minimum 20 GPA credits with grade point of "C" or above in each level',
        satisfied:
          level1CreditsAtLeastC >= 20 &&
          level2CreditsAtLeastC >= 20 &&
          level3CreditsAtLeastC >= 20,
        detail: `Earned C-or-above GPA credits: L1 - ${level1CreditsAtLeastC}, L2 - ${level2CreditsAtLeastC}, L3 - ${level3CreditsAtLeastC}`,
      },
      {
        id: "y3-degree-sdp-c-or-above",
        label:
          'At least a "C" grade for Software Development Project in Level III',
        satisfied: sdpPoint !== null && sdpPoint !== undefined && sdpPoint >= 2,
        detail: `Current: ${sdpGrade || "—"}`,
      },
      {
        id: "y3-degree-enhancement-pass",
        label: '"PASS" grade for enhancement courses in each level',
        satisfied:
          levelEnhancementPass(1) &&
          levelEnhancementPass(2) &&
          levelEnhancementPass(3),
      },
      {
        id: "y3-degree-no-below-d",
        label: 'No grade below "D" in any GPA course in each level',
        satisfied: levelNoBelowD(1) && levelNoBelowD(2) && levelNoBelowD(3),
      },
    ];

    yearRuleResults[3] = {
      title: "Level III degree eligibility rules",
      allSatisfied: degreeChecks.every((c) => c.satisfied),
      checks: degreeChecks,
    };

    const degreeEligible = yearRuleResults[3].allSatisfied;
    let degreeClass = "Not classified";

    if (degreeEligible) {
      if (classGpaValue >= 3.7) {
        degreeClass = "First Class";
      } else if (classGpaValue >= 3.3) {
        degreeClass = "Second Class (Upper Division)";
      } else if (classGpaValue >= 3.0) {
        degreeClass = "Second Class (Lower Division)";
      } else {
        degreeClass = "Degree Eligible (No Class Awarded)";
      }
    }

    const overallGPA =
      totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    const completionPercent = Math.round(
      (completedModules / requiredTotalGpaModules) * 100,
    );

    return {
      overallGPA,
      totalCredits,
      semesterResults,
      yearResults,
      completedModules,
      totalGpaModules: requiredTotalGpaModules,
      completionPercent,
      yearRuleResults,
      degreeEligible,
      degreeClass,
      classGPA: classTotalCredits > 0 ? classGpaValue.toFixed(2) : "0.00",
    };
  }, [grades, repeatGrades]);

  return { grades, repeatGrades, setGrade, setRepeatGrade, resetAll, stats };
}
