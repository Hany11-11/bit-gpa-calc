/**
 * ModuleRow — Single module with grade dropdown.
 * Displays module name, type badge, and grade selector.
 */

import { ChevronDown } from "lucide-react";
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
  grade: string;
  repeatGrade: string;
  onGradeChange: (moduleId: string, grade: string) => void;
  onRepeatGradeChange: (moduleId: string, grade: string) => void;
}

const typeBadge: Record<
  ModuleType,
  { label: string; className: string } | null
> = {
  gpa: null,
  "non-gpa": { label: "Non-GPA", className: "bg-muted text-muted-foreground" },
  optional: { label: "Optional", className: "bg-primary/10 text-primary" },
  "extra-optional": {
    label: "Extra Optional",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

export function ModuleRow({
  id,
  name,
  type,
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
  const previousNeedsRepeatRef = useRef(false);

  const badge = typeBadge[type];
  const gradeOptions =
    type === "non-gpa" ? NON_GPA_GRADE_OPTIONS : GPA_GRADE_OPTIONS;
  const gradeTone =
    grade === "Fail" || grade === "Not Sit"
      ? "text-destructive"
      : grade === "Pass"
        ? "text-success"
        : grade
          ? "text-primary"
          : "text-muted-foreground";

  const basePoint = grade ? GRADE_SCALE[grade] : null;
  const canRepeat =
    countsForGPA(type) &&
    grade !== "" &&
    grade !== "Not Sit" &&
    basePoint !== null &&
    basePoint !== undefined &&
    basePoint < GRADE_SCALE.C;
  const hasBaseGrade = grade !== "" && grade !== "Not Sit";
  const disableRepeatButton = !repeatOpen && !canRepeat && hasBaseGrade;
  const showRepeatControls = countsForGPA(type) || repeatOpen;
  const showRepeatInlineAlert = canRepeat && repeatGrade === "";
  const repeatHint = !hasBaseGrade
    ? "Select your first-attempt grade to unlock repeat."
    : canRepeat
      ? "Repeat is available for grades below C."
      : "";

  const repeatOptions = GPA_GRADE_OPTIONS.filter((g) => g !== "Not Sit");

  useEffect(() => {
    if (repeatGrade !== "") {
      setRepeatOpen(true);
    }
  }, [repeatGrade]);

  useEffect(() => {
    if (!canRepeat && (repeatOpen || repeatGrade !== "")) {
      setRepeatOpen(false);
      onRepeatGradeChange(id, "");
    }
  }, [canRepeat, id, onRepeatGradeChange, repeatGrade, repeatOpen]);

  useEffect(() => {
    const needsRepeatInput = canRepeat && repeatGrade === "";

    if (needsRepeatInput && !previousNeedsRepeatRef.current) {
      toast.error("If you have repeat, please input the repeat grade.", {
        description: "A grade below C was selected.",
        duration: 4000,
      });
    }

    previousNeedsRepeatRef.current = needsRepeatInput;
  }, [canRepeat, repeatGrade]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 8;
    const preferredHeight = 280;
    const minHeight = 160;
    const spaceBelow =
      window.innerHeight - triggerRect.bottom - viewportPadding;
    const spaceAbove = triggerRect.top - viewportPadding;
    const openUpward = spaceBelow < minHeight && spaceAbove > spaceBelow;
    const availableSpace = openUpward ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(
      140,
      Math.min(preferredHeight, Math.floor(availableSpace)),
    );

    const top = openUpward
      ? Math.max(viewportPadding, triggerRect.top - gap - maxHeight)
      : triggerRect.bottom + gap;
    const width = Math.max(triggerRect.width, 156);
    const left = Math.min(
      window.innerWidth - viewportPadding - width,
      Math.max(viewportPadding, triggerRect.right - width),
    );

    setMenuTop(top);
    setMenuLeft(left);
    setMenuWidth(width);
    setMenuMaxHeight(maxHeight);
  }, []);

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const onViewportChange = () => {
      updateMenuPosition();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, updateMenuPosition]);

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-3 group">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <label
            htmlFor={id}
            className="text-sm font-medium leading-tight truncate cursor-pointer"
          >
            {name}
          </label>
          {badge && (
            <span
              className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        <div className="relative shrink-0 w-28">
          <button
            id={id}
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold tabular-nums shadow-sm outline-none transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-primary/20 ${open ? "border-primary/60 bg-accent/30" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={`Choose grade for ${name}`}
          >
            <span className={gradeTone}>{grade || "Choose"}</span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {portalReady &&
            open &&
            createPortal(
              <div
                ref={menuRef}
                className="fixed z-[25] overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
                style={{
                  top: `${menuTop}px`,
                  left: `${menuLeft}px`,
                  width: `${menuWidth}px`,
                }}
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
                      onClick={() => {
                        onGradeChange(id, "");
                        onRepeatGradeChange(id, "");
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${!grade ? "bg-accent/70 text-accent-foreground" : "text-muted-foreground"}`}
                    >
                      <span>Choose</span>
                      {!grade && (
                        <span className="text-sm font-bold" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                  {gradeOptions.map((g) => (
                    <li key={g}>
                      <button
                        type="button"
                        onClick={() => {
                          onGradeChange(id, g);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground ${grade === g ? "bg-accent/70 text-accent-foreground" : "text-popover-foreground"}`}
                      >
                        <span>{g}</span>
                        {grade === g && (
                          <span
                            className="text-sm font-bold"
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>,
              document.body,
            )}
        </div>
      </div>

      {showRepeatInlineAlert && (
        <p className="mt-1 whitespace-nowrap text-[11px] font-medium leading-tight text-destructive text-right">
          If repeated, add repeat grade.
        </p>
      )}

      {showRepeatControls && (
        <div className="mt-2 rounded-lg border border-border/70 bg-secondary/30 px-2.5 py-2">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={disableRepeatButton}
              onClick={() => {
                if (!hasBaseGrade && !repeatOpen) {
                  toast.error("Select first-attempt grade first", {
                    description:
                      "You need to first choose the exact grade you got.",
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
              }}
              className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors ${repeatOpen ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"} ${disableRepeatButton ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}`}
            >
              Repeat
            </button>

            {repeatOpen && (
              <select
                value={repeatGrade}
                onChange={(e) => onRepeatGradeChange(id, e.target.value)}
                className="w-28 rounded-md border border-primary/30 bg-background px-2 py-1 text-xs font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primary/20"
                aria-label={`Repeat grade for ${name}`}
              >
                <option value="">Choose</option>
                {repeatOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>

          {repeatHint && (
            <p className="mt-1.5 text-[11px] text-muted-foreground text-right">
              {repeatHint}
            </p>
          )}

          {repeatOpen && (
            <p className="mt-1 text-[11px] text-primary text-right font-medium">
              Repeat rule: class GPA counts up to C, overall GPA uses the exact
              repeat grade.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
