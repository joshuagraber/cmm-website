import Image from "next/image";
import { cn } from "@/lib/utils";

type PhotoGridProps = {
  className?: string;
};

const photos = [
  {
    src: "/images/drue-josh-tyler.webp",
    alt: "Drue, Joshua Graber, and Ty McCloskey",
  },
  {
    src: "/images/doblin-tyler-soap.webp",
    alt: "Interview recording at SOAP",
  },
  {
    src: "/images/nyc-panel-interview.webp",
    alt: "Panel interview in New York City",
  },
  {
    src: "/images/photos-whole-gang.webp",
    alt: "Archive photographs arranged on a wall",
  },
  {
    src: "/images/tapes-table.webp",
    alt: "Cassette tapes arranged on a table",
  },
  {
    src: "/images/kilindi-josh-soap.webp",
    alt: "Kilindi and Joshua Graber recording an interview",
  },
  {
    src: "/images/susun-goats-josh.webp",
    alt: "Joshua Graber interviewing Susun outdoors with goats",
  },
  {
    src: "/images/painting-ghost.webp",
    alt: "Portrait painting of a man",
  },
  {
    src: "/images/linda-table.webp",
    alt: "Linda standing at a table with Joshua and Ty",
  },
  {
    src: "/images/painting-andrea.webp",
    alt: "Painted portrait of Andrea",
  },
  {
    src: "/images/musician-sign.webp",
    alt: "Handmade sign reading the musician relies on your support",
  },
  {
    src: "/images/linda-table.webp",
    alt: "Interview table with microphones",
  },
];

export function PhotoGrid({ className }: PhotoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-5",
        className,
      )}
    >
      {photos.map((photo) => (
        <div
          key={photo.src + photo.alt}
          className="relative aspect-square overflow-hidden bg-muted"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 768px) 15vw, 50vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
