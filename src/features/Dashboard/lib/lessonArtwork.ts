type ArtworkRule = {
  keywords: string[];
  asset: string;
};

type LessonArtworkInput = {
  subject: string;
  topic: string;
  title: string;
};

const artworkRules: ArtworkRule[] = [
  {
    keywords: ["algebra", "equation", "linear", "simultaneous"],
    asset: "/dashboard-art/mathematics-algebra.svg",
  },
  {
    keywords: ["fraction", "decimal", "ratio", "pizza"],
    asset: "/dashboard-art/mathematics-fractions.svg",
  },
  {
    keywords: ["photosynthesis", "chlorophyll", "stomata", "leaf"],
    asset: "/dashboard-art/science-photosynthesis.svg",
  },
  {
    keywords: ["plant", "biology", "cell", "ecosystem"],
    asset: "/dashboard-art/science-plant-biology.svg",
  },
  {
    keywords: ["water cycle", "evaporation", "condensation", "precipitation"],
    asset: "/dashboard-art/science-water-cycle.svg",
  },
  {
    keywords: ["ancient", "civilization", "empire", "history"],
    asset: "/dashboard-art/history-ancient-civilizations.svg",
  },
  {
    keywords: ["shakespeare", "literature", "drama", "play"],
    asset: "/dashboard-art/literature-shakespeare.svg",
  },
  {
    keywords: ["poetry", "poem", "stanza", "figurative"],
    asset: "/dashboard-art/literature-poetry.svg",
  },
  {
    keywords: ["geography", "map", "continent", "climate"],
    asset: "/dashboard-art/geography-world.svg",
  },
  {
    keywords: ["science", "experiment", "laboratory", "chemistry", "physics"],
    asset: "/dashboard-art/science-lab.svg",
  },
];

const subjectFallbacks: Record<string, string> = {
  mathematics: "/dashboard-art/mathematics-algebra.svg",
  science: "/dashboard-art/science-lab.svg",
  history: "/dashboard-art/history-ancient-civilizations.svg",
  literature: "/dashboard-art/literature-poetry.svg",
  geography: "/dashboard-art/geography-world.svg",
  english: "/dashboard-art/literature-shakespeare.svg",
};

export function getLessonArtwork(lesson: LessonArtworkInput) {
  const haystack = `${lesson.subject} ${lesson.topic} ${lesson.title}`.toLowerCase();

  const matchedRule = artworkRules.find((rule) =>
    rule.keywords.some((keyword) => haystack.includes(keyword)),
  );

  if (matchedRule) {
    return matchedRule.asset;
  }

  const normalizedSubject = lesson.subject.toLowerCase();
  return subjectFallbacks[normalizedSubject] || "/dashboard-art/generic-study.svg";
}
