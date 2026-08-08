export const microdoseIconNames = [
  "archive",
  "atom",
  "audio-lines",
  "beaker",
  "book-open",
  "brain",
  "cassette",
  "dna",
  "eye",
  "flask",
  "flower",
  "ghost",
  "headphones",
  "library",
  "mic",
  "molecule",
  "notebook",
  "octopus",
  "pill",
  "podcast",
  "quote",
  "radio",
  "scroll",
  "signal",
  "sparkles",
  "telescope",
  "test-tube",
  "waves",
  "zap",
] as const;

export type MicrodoseIcon = (typeof microdoseIconNames)[number];

export const microdoseTabColorPairs = [
  {
    surface: "var(--acid-tab-surface-a)",
    icon: "var(--acid-tab-ink)",
  },
  {
    surface: "var(--acid-tab-surface-b)",
    icon: "var(--acid-tab-ink)",
  },
  {
    surface: "var(--acid-tab-surface-c)",
    icon: "var(--acid-tab-ink)",
  },
  {
    surface: "var(--acid-tab-surface-d)",
    icon: "var(--acid-tab-ink)",
  },
  {
    surface: "var(--acid-tab-surface-e)",
    icon: "var(--acid-tab-ink)",
  },
  {
    surface: "var(--acid-tab-surface-f)",
    icon: "var(--acid-tab-ink)",
  },
  {
    surface: "var(--acid-tab-surface-g)",
    icon: "var(--acid-tab-ink)",
  },
  {
    surface: "var(--acid-tab-surface-h)",
    icon: "var(--acid-tab-ink)",
  },
] as const;
