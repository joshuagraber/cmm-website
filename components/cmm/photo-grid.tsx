import Image from "next/image";
import { cn } from "@/lib/utils";

type PhotoGridProps = {
  className?: string;
};

const photos = [
  {
    src: "/images/doblin-tyler-josh-soap.webp",
    alt: "Rick Doblin, Ty McCloskey, and Joshua Graber at SOAP",
  },
  {
    src: "/images/drue-josh-tyler.webp",
    alt: "Drue Sanders, Joshua Graber, and Ty McCloskey",
  },
  {
    src: "/images/doblin-tyler-soap.webp",
    alt: "Interview recording at SOAP: Ty and Rick Doblin",
  },
  {
    src: "/images/nyc-panel-interview.webp",
    alt: "Panel interview in New York City",
  },
  {
    src: "/images/photos-whole-gang.webp",
    alt: "Archive photographs of Richard Barth Sanders and gang, arranged on a wall",
  },
  {
    src: "/images/tapes-table.webp",
    alt: "Cassette tapes of Richard Sanders's flute recordings arranged on a table",
  },
  {
    src: "/images/kilindi-josh-soap.webp",
    alt: "Kilindi Iyi and Joshua Graber recording an interview",
  },
  {
    src: "/images/susun-goats-josh.webp",
    alt: "Joshua Graber interviewing Susun Weed outdoors amongst her goats",
  },
  {
    src: "/images/painting-ghost.webp",
    alt: "Portrait painting of a Richard Barth Sanders by Linda Shrig",
  },
  {
    src: "/images/linda-table.webp",
    alt: "Linda sitting at a table recording an interview with Joshua and Ty",
  },
  {
    src: "/images/painting-andrea.webp",
    alt: "Painted portrait of Andrea Layton by Linda Shrig",
  },
  {
    src: "/images/musician-sign.webp",
    alt: "Handmade sign reading the musician relies on your support",
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
