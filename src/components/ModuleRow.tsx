/**
 * ModuleRow — Module with inline Repeat button + Grade dropdown.
 * Matches reference design: name/credits on left, controls on right.
 */

import { ChevronDown, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "./ui/sonner";
import {
  countsForGPA,
  GRADE_SCALE,
  GPA_GRADE_OPTIONS,
  NON_GPA_GRADE_OPTIONS,
  type ModuleType,
} from "@/utils/constants";

interface ModuleRowProps {
  id: string;
  name: string;
  type: ModuleType;
  credits: number;
  grade: string;
  repeatGrade: string;
  onGradeChange: (moduleId: string, grade: string) => void;
  onRepeatGradeChange: (moduleId: string, grade: string) => void;
}

function getGradeColor(grade: string): string {
  if (!grade) return "text-slate-400 dark:text-slate-500";
  if (grade === "Fail" || grade === "Not Sit") return "text-red-500 font-semibold";
  if (grade === "Pass") return "text-emerald-600 dark:text-emerald-400 font-semibold";
  const point = GRADE_SCALE[grade];
  if (point === null || point === undefined) return "text-slate-500";
  if (point >= 3.7) return "text-emerald-600 dark:text-emerald-400 font-bold";
  if (point >= 3.0) return "text-sky-600 dark:text-sky-400 font-semibold";
  if (point >= 2.3) return "text-indigo-600 dark:text-indigo-400 font-semibold";
  if (point >= 2.0) return "text-amber-600 dark:text-amber-400 font-semibold";
  return "text-red-500 font-semibold";
}

const TYPE_BADGE: Record<ModuleType, { label: string; cls: string } | null> = {
  gpa: null,
  "non-gpa": {
    label: "Non-GPA",
    cls: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  },
  optional: {
    label: "Optional",
    cls: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
  },
  "extra-optional": {
    label: "Extra Opt",
    cls: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
  },
};

export function ModuleRow({
  id,
  name,
  type,
  credits,
  grade,
  repeatGrade,
  onGradeChange,
  onRepeatGradeChange,
}: ModuleRowProps) {
  const [open, setOpen] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(repeatGrade !== "");
  const [portalReady, setPortalReady] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuWidth, setMenuWidth] = useState(160);
  const [menuMaxHeight, setMenuMaxHeight] = useState(280);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevNeedsRepeatRef = useRef(false);

  const badge = TYPE_BADGE[type];
  const gradeOptions = type === "non-gpa" ? NON_GPA_GRADE_OPTIONS : GPA_GRADE_OPTIONS;
  const gradeColor = getGradeColor(grade);

  const basePoint = grade ? GRADE_SCALE[grade] : null;
  const canRepeat =
    countsForGPA(type) &&
    grade !== "" &&
    grade !== "Not Sit" &&
    basePoint !== null &&
    basePoint !== undefined &&
    basePoint < GRADE_SCALE.C;
  const hasBaseGrade = grade !== "" && grade !== "Not Sit";
  const showRepeatButton = countsForGPA(type);
  const repeatOptions = GPA_GRADE_OPTIONS.filter((g) => g !== "Not Sit");

  useEffect(() => {
    if (repeatGrade !== "") setRepeatOpen(true);
  }, [repeatGrade]);

  useEffect(() => {
    if (!canRepeat && (repeatOpen || repeatGrade !== "")) {
      setRepeatOpen(false);
      onRepeatGradeChange(id, "");
    }
  }, [canRepeat, id, onRepeatGradeChange, repeatGrade, repeatOpen]);

  useEffect(() => {
    const needsRepeat = canRepeat && repeatGrade === "";
    if (needsRepeat && !prevNeedsRepeatRef.current) {
      toast.error("If you have repeat, please input the repeat grade.", {
        description: "A grade below C was selected.",
        duration: 4000,
      });
    }
    prevNeedsRepeatRef.current = needsRepeat;
  }, [canRepeat, repeatGrade]);

  useEffect(() => { setPortalReady(true); }, []);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vp = 12;
    const gap = 6;
    const preferred = 260;
    const minH = 140;
    const below = window.innerHeight - rect.bottom - vp;
    const above = rect.top - vp;
    const up = below < minH && above > below;
    const avail = up ? above : below;
    const maxH = Math.max(120, Math.min(preferred, Math.floor(avail)));
    const top = up ? Math.max(vp, rect.top - gap - maxH) : rect.bottom + gap;
    const w = Math.max(rect.width, 140);
    const left = Math.min(window.innerWidth - vp - w, Math.max(vp, rect.right - w));
    setMenuTop(top);
    setMenuLeft(left);
    setMenuWidth(w);
    setMenuMaxHeight(maxH);
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onVp = () => updateMenuPosition();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("resize", onVp);
    window.addEventListener("scroll", onVp, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", onVp);
      window.removeEventListener("scroll", onVp, true);
    };
  }, [open, updateMenuPosition]);

  const handleRepeatClick = () => {
    if (!hasBaseGrade) {
      toast.error("Select first-attempt grade first", {
        description: "You need to choose the grade you got before adding a repeat.",
        duration: 3000,
      });
      return;
    }
    if (!canRepeat && !repeatOpen) {
      toast("Repeat not available", {
        description: "Repeat is only allowed for grades below C.",
        duration: 3000,
      });
      return;
    }
    if (repeatOpen) {
      setRepeatOpen(false);
      onRepeatGradeChange(id, "");
    } else {
      setRepeatOpen(true);
    }
  };

  return (
    <div className="px-5 py-3">
      {/* Main row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: name + credits */}
        <div className="min-w-0 flex-1">
          <label
            htmlFor={id}
            className="text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer block leading-tight truncate"
          >
            {name}
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {credits} Credits
            </span>
            {badge && (
              <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>
        </div>

        {/* Right: Repeat + Grade */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Repeat button — only for GPA modules */}
          {showRepeatButton && (
            <button
              type="button"
              onClick={handleRepeatClick}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                repeatOpen
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400"
                  : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
              title={canRepeat ? "Add repeat grade" : "Repeat only for grades below C"}
            >
              <RefreshCw className="h-3 w-3" />
              Repeat
            </button>
          )}

          {/* Grade dropdown */}
          <div className="relative w-24">
            <button
              id={id}
              ref={triggerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`flex w-full items-center justify-between gap-1 rounded-lg border px-2.5 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 ${
                open
                  ? "border-violet-400 dark:border-violet-500 bg-violet-50/50 dark:bg-violet-950/20"
                  : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={`Choose grade for ${name}`}
            >
              <span className={grade ? gradeColor : "text-slate-400 dark:text-slate-500 font-normal"}>
                {grade || "Grade"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown portal */}
            {portalReady && open && createPortal(
              <div
                ref={menuRef}
                className="fixed z-[200] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl"
                style={{ top: `${menuTop}px`, left: `${menuLeft}px`, width: `${menuWidth}px` }}
              >
                <ul
                  className="overflow-y-auto py-1"
                  style={{ maxHeight: `${menuMaxHeight}px` }}
                  role="listbox"
                  aria-label={`${name} grade options`}
                >
                  <li>
                    <button
                      type="button"
                      onClick={() => { onGradeChange(id, ""); onRepeatGradeChange(id, ""); setOpen(false); }}
                      className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        !grade ? "text-slate-500 font-medium bg-slate-50 dark:bg-slate-700/50" : "text-slate-400"
                      }`}
                    >
                      <span>Clear</span>
                      {!grade && <span className="text-violet-600 font-bold text-xs">✓</span>}
                    </button>
                  </li>
                  {gradeOptions.map((g) => (
                    <li key={g}>
                      <button
                        type="button"
                        onClick={() => { onGradeChange(id, g); setOpen(false); }}
                        className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                          grade === g ? "bg-slate-50 dark:bg-slate-700/50 font-semibold" : ""
                        }`}
                      >
                        <span className={getGradeColor(g)}>{g}</span>
                        {grade === g && <span className="text-violet-600 font-bold text-xs">✓</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>,
              document.body,
            )}
          </div>
        </div>
      </div>

      {/* Repeat grade row (when open) */}
      {repeatOpen && (
        <div className="mt-2 flex items-center gap-2 pl-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Repeat grade:
          </span>
          <select
            value={repeatGrade}
            onChange={(e) => onRepeatGradeChange(id, e.target.value)}
            className="rounded-lg border border-violet-200 dark:border-violet-700/50 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-500/25"
            aria-label={`Repeat grade for ${name}`}
          >
            <option value="">Choose</option>
            {repeatOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <span className="text-[10px] text-violet-500 dark:text-violet-400">
            Class GPA capped at C
          </span>
        </div>
      )}
    </div>
  );
}
