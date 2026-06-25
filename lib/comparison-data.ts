export interface ComparisonSubject {
  id: string;
  label: string;
  sourceImage: string;
  facednerfModel: string;
  triposrModel: string;
}

export const COMPARISON_SUBJECTS: ComparisonSubject[] = [
  {
    id: "subject-1",
    label: "Subject 1",
    sourceImage: "/comparison/subject-1/input.jpg",
    facednerfModel: "/comparison/subject-1/facednerf.ply",
    triposrModel: "/comparison/subject-1/triposr.ply",
  },
  {
    id: "subject-2",
    label: "Subject 2",
    sourceImage: "/comparison/subject-2/input.jpg",
    facednerfModel: "/comparison/subject-2/facednerf.ply",
    triposrModel: "/comparison/subject-2/triposr.ply",
  },
];
