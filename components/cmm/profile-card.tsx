import Image from "next/image";
import { cn } from "@/lib/utils";

type ProfileCardProps = {
  name: string;
  bio: string;
  image: {
    src: string;
    alt: string;
  };
  eager?: boolean;
  className?: string;
};

export function ProfileCard({
  name,
  bio,
  image,
  eager = false,
  className,
}: ProfileCardProps) {
  return (
    <article className={cn("grid gap-8", className)}>
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 768px) 45vw, 100vw"
          className="object-cover"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
        />
      </div>
      <div>
        <h2 className="font-serif text-4xl font-semibold leading-tight">{name}</h2>
        <p className="mt-6 max-w-xl text-xl leading-relaxed text-foreground">{bio}</p>
      </div>
    </article>
  );
}
