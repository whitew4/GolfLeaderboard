// src/config/coursePars.ts
export type CoursePars = {
  courseName: string;
  holes: number[];   // index 0 = Hole 1, etc.
  totalPar: number;  // sum of holes
};

// Key = round number (1 = first 18, 2 = second 18)
export const COURSE_PARS_BY_ROUND: Record<number, CoursePars> = {
  1: {
    courseName: "Kelly Plantation Golf Club",
    holes: [4,5,3,4,4,5,4,3,4, 5,4,3,5,4,3,4,3,5], // Example par layout
    totalPar: 72,
  },
  2: {
    courseName: "Emerald Bay Golf Club",
    holes: [4,4,3,4,4,4,5,3,5, 4,4,3,5,4,4,3,4,5], // Example par layout
    totalPar: 70,
  },
};
