import Link from "next/link";
import { cn } from "@/lib/utils";

type StampLogoProps = {
  className?: string;
};

function StampMark() {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="size-full"
      fill="none"
    >
      <path
        d="M8 4 H19 C19 12 31 12 31 4 H42 C42 12 54 12 54 4 H65 C65 12 77 12 77 4 H92 Q96 4 96 8 V19 C88 19 88 31 96 31 V42 C88 42 88 54 96 54 V65 C88 65 88 77 96 77 V92 Q96 96 92 96 H77 C77 88 65 88 65 96 H54 C54 88 42 88 42 96 H31 C31 88 19 88 19 96 H8 Q4 96 4 92 V77 C12 77 12 65 4 65 V54 C12 54 12 42 4 42 V31 C12 31 12 19 4 19 V8 Q4 4 8 4 Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        className="font-serif text-[26px] font-black italic tracking-[-0.12em]"
      >
        cmm
      </text>
    </svg>
  );
}

export function StampLogo({ className }: StampLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Cool Molecules Media home"
      className={cn(
        "grid size-24 place-items-center bg-transparent text-foreground",
        className,
      )}
    >
      <StampMark />
    </Link>
  );
}
