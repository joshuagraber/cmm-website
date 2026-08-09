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
    icon: "var(--acid-tab-icon-a)",
  },
  {
    surface: "var(--acid-tab-surface-b)",
    icon: "var(--acid-tab-icon-b)",
  },
  {
    surface: "var(--acid-tab-surface-c)",
    icon: "var(--acid-tab-icon-c)",
  },
  {
    surface: "var(--acid-tab-surface-d)",
    icon: "var(--acid-tab-icon-d)",
  },
  {
    surface: "var(--acid-tab-surface-e)",
    icon: "var(--acid-tab-icon-e)",
  },
  {
    surface: "var(--acid-tab-surface-f)",
    icon: "var(--acid-tab-icon-f)",
  },
  {
    surface: "var(--acid-tab-surface-g)",
    icon: "var(--acid-tab-icon-g)",
  },
  {
    surface: "var(--acid-tab-surface-h)",
    icon: "var(--acid-tab-icon-h)",
  },
  {
    surface: "var(--acid-tab-surface-i)",
    icon: "var(--acid-tab-icon-i)",
  },
  {
    surface: "var(--acid-tab-surface-j)",
    icon: "var(--acid-tab-icon-j)",
  },
  {
    surface: "var(--acid-tab-surface-k)",
    icon: "var(--acid-tab-icon-k)",
  },
  {
    surface: "var(--acid-tab-surface-l)",
    icon: "var(--acid-tab-icon-l)",
  },
  {
    surface: "var(--acid-tab-surface-m)",
    icon: "var(--acid-tab-icon-m)",
  },
  {
    surface: "var(--acid-tab-surface-n)",
    icon: "var(--acid-tab-icon-n)",
  },
  {
    surface: "var(--acid-tab-surface-o)",
    icon: "var(--acid-tab-icon-o)",
  },
  {
    surface: "var(--acid-tab-surface-p)",
    icon: "var(--acid-tab-icon-p)",
  },
] as const;
