import tuesdayPoster from "@/assets/tue-study-circle.png";
import thursdayPoster from "@/assets/thu-study-circle.png";
import type { ProgramType } from "@/lib/studycircle";

export const STUDY_CIRCLE_POSTERS: Record<ProgramType, string> = {
  kathamrita: tuesdayPoster,
  pathochokro: thursdayPoster,
};
