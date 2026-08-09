import { FaBoltLightning, FaPodcast, FaRadio } from "react-icons/fa6";
import {
  GiAerialSignal,
  GiArchiveResearch,
  GiBrain,
  GiBubblingFlask,
  GiDna2,
  GiFizzingFlask,
  GiMolecule,
  GiOctopus,
  GiOldMicrophone,
  GiOpenBook,
  GiScrollQuill,
  GiSoundWaves,
  GiSparkles,
  GiTestTubes,
} from "react-icons/gi";
import {
  PiAtom,
  PiCassetteTape,
  PiEye,
  PiFlowerLotus,
  PiGhost,
  PiHeadphones,
  PiPill,
  PiQuotes,
  PiWaveform,
} from "react-icons/pi";
import { TbLibrary, TbNotebook, TbTelescope } from "react-icons/tb";
import type { IconType } from "react-icons";
import type { MicrodoseIcon } from "@/lib/microdoses";
import { cn } from "@/lib/utils";

type MicrodoseIconMarkProps = {
  icon: MicrodoseIcon;
  className?: string;
  color?: string;
};

const iconComponents: Record<MicrodoseIcon, IconType> = {
  archive: GiArchiveResearch,
  atom: PiAtom,
  "audio-lines": PiWaveform,
  beaker: GiBubblingFlask,
  "book-open": GiOpenBook,
  brain: GiBrain,
  cassette: PiCassetteTape,
  dna: GiDna2,
  eye: PiEye,
  flask: GiFizzingFlask,
  flower: PiFlowerLotus,
  ghost: PiGhost,
  headphones: PiHeadphones,
  library: TbLibrary,
  mic: GiOldMicrophone,
  molecule: GiMolecule,
  notebook: TbNotebook,
  octopus: GiOctopus,
  pill: PiPill,
  podcast: FaPodcast,
  quote: PiQuotes,
  radio: FaRadio,
  scroll: GiScrollQuill,
  signal: GiAerialSignal,
  sparkles: GiSparkles,
  telescope: TbTelescope,
  "test-tube": GiTestTubes,
  waves: GiSoundWaves,
  zap: FaBoltLightning,
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
      style={color ? { color } : undefined}
      className={cn("shrink-0", iconClasses[icon], className)}
    />
  );
}
