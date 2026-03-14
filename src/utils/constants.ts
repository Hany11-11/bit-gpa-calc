/**
 * UCSC BIT Degree Program - Grade Scale & Semester Data
 * Contains all module definitions and grade point mappings.
 */

// Grade scale mapping: grade letter → grade point value
// null means the module is excluded from calculation (Not Sit)
export const GRADE_SCALE: Record<string, number | null> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  E: 0.0,
  "Not Sit": null,
  Pass: null,
  Fail: null,
};

export const GPA_GRADE_OPTIONS = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "E",
  "Not Sit",
];

export const NON_GPA_GRADE_OPTIONS = ["Pass", "Fail", "Not Sit"];

export type ModuleType = "gpa" | "non-gpa" | "optional" | "extra-optional";

// GPA formula includes compulsory (gpa) and required optional (optional) modules.
export function countsForGPA(type: ModuleType) {
  return type === "gpa" || type === "optional";
}

export interface Module {
  id: string;
  name: string;
  type: ModuleType;
  credits: number;
}

export interface Semester {
  id: number;
  title: string;
  modules: Module[];
}

export interface Year {
  id: number;
  title: string;
  semesters: Semester[];
}

export const YEARS: Year[] = [
  {
    id: 1,
    title: "1st Year",
    semesters: [
      {
        id: 1,
        title: "Semester 1",
        modules: [
          {
            id: "IT1106",
            name: "Information Systems",
            type: "gpa",
            credits: 4,
          },
          { id: "IT1406", name: "Programming", type: "gpa", credits: 4 },
          { id: "IT1206", name: "Computer Systems", type: "gpa", credits: 3 },
          {
            id: "IT1306",
            name: "FOSS Personal Computing",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT1506",
            name: "Fundamentals of Mathematics",
            type: "gpa",
            credits: 1,
          },
        ],
      },
      {
        id: 2,
        title: "Semester 2",
        modules: [
          { id: "IT2306", name: "Database Systems", type: "gpa", credits: 4 },
          {
            id: "IT2406",
            name: "Web Application Development I",
            type: "gpa",
            credits: 4,
          },
          {
            id: "IT2106",
            name: "Mathematics for Computing I",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT2206",
            name: "Software Engineering",
            type: "gpa",
            credits: 4,
          },
          {
            id: "BIT1205",
            name: "Communication Skills 1",
            type: "non-gpa",
            credits: 0,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "2nd Year",
    semesters: [
      {
        id: 3,
        title: "Semester 3",
        modules: [
          {
            id: "EN3106",
            name: "Communication Skills II",
            type: "non-gpa",
            credits: 0,
          },
          {
            id: "IT3106",
            name: "Object Oriented Analysis & Design",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT3206",
            name: "Data Structures and Algorithms",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT3306",
            name: "Data Management Systems",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT3406",
            name: "Web Application Development II",
            type: "gpa",
            credits: 4,
          },
        ],
      },
      {
        id: 4,
        title: "Semester 4",
        modules: [
          {
            id: "IT4106",
            name: "User Experience Design",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT4206",
            name: "Enterprise Application Development",
            type: "gpa",
            credits: 4,
          },
          {
            id: "IT4306",
            name: "Information Technology Project Management",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT4406",
            name: "Agile Software Development",
            type: "gpa",
            credits: 4,
          },
          {
            id: "IT4506",
            name: "Computer Networks",
            type: "gpa",
            credits: 3,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "3rd Year (Final)",
    semesters: [
      {
        id: 5,
        title: "Semester 5",
        modules: [
          {
            id: "EN5106",
            name: "Fundamentals of Management & Entrepreneurship",
            type: "non-gpa",
            credits: 0,
          },
          {
            id: "IT5206",
            name: "Professional Practice",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT5306",
            name: "Principles of Information Security",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT5406",
            name: "Systems & Network Administration",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT5506",
            name: "Mathematics for Computing II",
            type: "optional",
            credits: 3,
          },
        ],
      },
      {
        id: 6,
        title: "Semester 6",
        modules: [
          {
            id: "EN6106",
            name: "Emerging Topics in Information Technology",
            type: "non-gpa",
            credits: 2,
          },
          {
            id: "IT6206",
            name: "Software Quality Assurance",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT6306",
            name: "Mobile Application Development",
            type: "gpa",
            credits: 4,
          },
          {
            id: "IT6406",
            name: "Network Security & Audit",
            type: "gpa",
            credits: 3,
          },
          {
            id: "IT6506",
            name: "e-Business Technologies",
            type: "optional",
            credits: 3,
          },
          {
            id: "IT5106",
            name: "Software Development Project (Sem 5 & 6)",
            type: "gpa",
            credits: 8,
          },
        ],
      },
    ],
  },
];

export const SEMESTERS: Semester[] = YEARS.flatMap((y) => y.semesters);

// Total possible GPA modules (excluding non-gpa, including optional)
export const TOTAL_GPA_MODULES = SEMESTERS.reduce(
  (acc, sem) => acc + sem.modules.filter((m) => countsForGPA(m.type)).length,
  0,
);
