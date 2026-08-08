import {
  Archive,
  Atom,
  AudioLines,
  AudioWaveform,
  Beaker,
  BookOpen,
  BrainCircuit,
  CassetteTape,
  CircleDot,
  FileText,
  Dna,
  Eye,
  FlaskConical,
  Headphones,
  Library,
  Mic,
  NotebookText,
  Orbit,
  Pill,
  Podcast,
  Quote,
  Radio,
  ScrollText,
  SquareAsterisk,
  Telescope,
  TestTube,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { MicrodoseIcon } from "@/lib/microdoses";
import { cn } from "@/lib/utils";

type MicrodoseIconMarkProps = {
  icon: MicrodoseIcon;
  className?: string;
  color?: string;
};

const iconComponents: Record<MicrodoseIcon, LucideIcon> = {
  archive: Archive,
  atom: Atom,
  "audio-lines": AudioLines,
  beaker: Beaker,
  "book-open": BookOpen,
  brain: BrainCircuit,
  cassette: CassetteTape,
  dna: Dna,
  eye: Eye,
  flask: FlaskConical,
  flower: SquareAsterisk,
  ghost: FileText,
  headphones: Headphones,
  library: Library,
  mic: Mic,
  molecule: Orbit,
  notebook: NotebookText,
  octopus: CircleDot,
  pill: Pill,
  podcast: Podcast,
  quote: Quote,
  radio: Radio,
  scroll: ScrollText,
  signal: AudioWaveform,
  sparkles: SquareAsterisk,
  telescope: Telescope,
  "test-tube": TestTube,
  waves: Waves,
  zap: Zap,
};

const iconClasses: Record<MicrodoseIcon, string> = {
  archive: "text-cmm-black dark:text-cmm-yellow",
  atom: "text-cmm-green",
  "audio-lines": "text-cmm-blue",
  beaker: "text-cmm-coral",
  "book-open": "text-cmm-black dark:text-cmm-yellow",
  brain: "text-cmm-blue",
  cassette: "text-cmm-coral",
  dna: "text-cmm-green",
  eye: "text-cmm-black dark:text-cmm-yellow",
  flask: "text-cmm-coral",
  flower: "text-cmm-green",
  ghost: "text-cmm-blue",
  headphones: "text-cmm-blue",
  library: "text-cmm-black dark:text-cmm-yellow",
  mic: "text-cmm-coral",
  molecule: "text-cmm-black dark:text-cmm-yellow",
  notebook: "text-cmm-black dark:text-cmm-yellow",
  octopus: "text-cmm-coral",
  pill: "text-cmm-green",
  podcast: "text-cmm-coral",
  quote: "text-cmm-black dark:text-cmm-yellow",
  radio: "text-cmm-blue",
  scroll: "text-cmm-black dark:text-cmm-yellow",
  signal: "text-cmm-green",
  sparkles: "text-cmm-coral",
  telescope: "text-cmm-blue",
  "test-tube": "text-cmm-green",
  waves: "text-cmm-blue",
  zap: "text-cmm-coral",
};

export function MicrodoseIconMark({
  icon,
  className,
  color,
}: MicrodoseIconMarkProps) {
  const Icon = iconComponents[icon];

  return (
    <Icon
      aria-hidden="true"
      strokeWidth={1.8}
      style={color ? { color } : undefined}
      className={cn(iconClasses[icon], className)}
    />
  );
}
