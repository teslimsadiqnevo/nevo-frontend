export let pathLinks: {path: string, desc: string, name: string, icon: IconType}[] = [
  {
    path: "Student / Learner",
    desc: "A learning experience that fits you. Lessons adapt to your pace, focus, and learning style — step by step, without overwhelm.",
    name: "Student",
    icon: "grad",
  },
  {
    path: "Teacher",
    desc: "Understand students beyond performance. Nevo helps you teach with clarity, insight, and support — without guessing what learners need.",
    name: "Teacher",
    icon: "female-teacher",
  },
  {
    path: "School",
    desc: "A calmer learning system, at scale. Support diverse learners, empower teachers, and improve outcomes with a platform designed for accessibility.",
    name: "School",
    icon: "school",
  },
];

import { IconType } from "../ui";

export let features: { icon: IconType; header: string; desc: string }[] = [
  {
    icon: "adapt",
    header: "Adaptive by design",
    desc: "Nevo adjusts lesson pacing, layout, and support based on how learners engage — not a one-size dashboard.",
  },
  {
    icon: "leaf-drop",
    header: "Calm and cognitively safe",
    desc: "No clutter. No pressure. Just clear learning flows that respect attention and emotional ease.",
  },
  {
    icon: "paw",
    header: "Built for real classrooms",
    desc: "Teachers get meaningful insight, and schools get visibility — without surveillance or overwhelm.",
  },
];

import onboardImg from "@/shared/assets/onboard.png";
import adaptImg from "@/shared/assets/adapt.png";
import progressImg from "@/shared/assets/progress.png";

export let works = [
  {
    icon: onboardImg,
    header: "Learners onboard in minutes",
    desc: "A short assessment helps Nevo understand learning needs without labels or long forms.",
  },
  {
    icon: adaptImg,
    header: "Lessons adapt automatically",
    desc: "Visual, audio, hands-on, or structured — Nevo delivers the same goal in the way that works best.",
  },
  {
    icon: progressImg,
    header: "Progress becomes sustainable",
    desc: "With gentle feedback, pacing support, and teacher connection, learning stays possible.",
  },
];
