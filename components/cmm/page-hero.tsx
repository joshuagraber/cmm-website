import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  deck?: string;
  align?: "left" | "center";
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  deck,
  align = "left",
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "px-site-x py-section-y",
        align === "center" && "text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "font-serif text-[clamp(3rem,13vw,3.75rem)] font-semibold leading-[0.96] tracking-normal text-foreground md:text-8xl",
          align === "center" && "mx-auto max-w-[min(12ch,100%)]",
        )}
      >
        {title}
      </h1>
      {deck ? (
        <p
          className={cn(
            "mt-8 max-w-3xl text-2xl leading-snug text-foreground md:text-4xl",
            align === "center" && "mx-auto",
          )}
        >
          {deck}
        </p>
      ) : null}
    </section>
  );
}
