import {
  AudioWaveform,
  Bot,
  Ghost,
  Orbit,
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
  ghost: Ghost,
  octopus: Bot,
  signal: AudioWaveform,
  molecule: Orbit,
};

const iconClasses: Record<MicrodoseIcon, string> = {
  ghost: "text-cmm-blue",
  octopus: "text-cmm-coral",
  signal: "text-cmm-green",
  molecule: "text-cmm-black dark:text-cmm-yellow",
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
