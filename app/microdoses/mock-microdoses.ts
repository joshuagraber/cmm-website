import type {
  MicrodoseSheetItem,
} from "@/components/microdoses/microdose-sheet";
import type { Microdose, MicrodoseTabColorPair } from "@/lib/microdoses";

const mockCopies = 24;
const mockTabVariants: Array<{
  speakerLabel: string;
  icon: Microdose["icon"];
  tabColorPair: MicrodoseTabColorPair;
}> = [
  {
    speakerLabel: "Ghost tape",
    icon: "ghost",
    tabColorPair: {
      surface: "var(--acid-tab-surface-a)",
      icon: "var(--brand-accent-cool)",
    },
  },
  {
    speakerLabel: "CMM Archive",
    icon: "molecule",
    tabColorPair: {
      surface: "var(--acid-tab-surface-b)",
      icon: "var(--brand-accent-warm)",
    },
  },
  {
    speakerLabel: "Gul Dolen",
    icon: "signal",
    tabColorPair: {
      surface: "var(--acid-tab-surface-c)",
      icon: "var(--brand-ink-strong)",
    },
  },
  {
    speakerLabel: "Lab notes",
    icon: "octopus",
    tabColorPair: {
      surface: "var(--acid-tab-surface-d)",
      icon: "var(--brand-accent-cool)",
    },
  },
];

export function getMicrodoseSheetItems(
  microdoses: Microdose[],
): MicrodoseSheetItem[] {
  if (microdoses.length !== 1) {
    return microdoses;
  }

  const [microdose] = microdoses;

  return Array.from({ length: mockCopies }, (_, index) => {
    const variant = mockTabVariants[index % mockTabVariants.length];
    const tabColorPair =
      microdose.tabColorPairs[index % microdose.tabColorPairs.length] ??
      variant.tabColorPair;

    return {
      ...microdose,
      speakerLabel: variant.speakerLabel,
      icon: variant.icon,
      sheetId: `${microdose.id}-mock-${index + 1}`,
      title:
        index === 0
          ? microdose.title
          : `${microdose.title} / Mock ${index + 1}`,
      tabColorPair,
      href: `/microdoses/${microdose.id}`,
    };
  });
}
