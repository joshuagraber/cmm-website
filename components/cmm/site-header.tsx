"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StampLogo } from "@/components/cmm/stamp-logo";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  active?: "about" | "contact";
};

const links = [
  { href: "#about", label: "About", key: "about" },
  { href: "#contact", label: "Contact", key: "contact" },
] as const;

export function SiteHeader({ active }: SiteHeaderProps) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const scrollDelta = 6;

    function updateHeader() {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress =
        scrollableHeight > 0 ? currentScrollY / scrollableHeight : 0;
      const isPastThreshold = scrollProgress > 0.15;
      const isScrollingDown = currentScrollY > lastScrollY.current + scrollDelta;
      const isScrollingUp = currentScrollY < lastScrollY.current - scrollDelta;

      if (!isPastThreshold || currentScrollY < 16 || isScrollingUp) {
        setHidden(false);
      } else if (isScrollingDown) {
        setHidden(true);
      }

      lastScrollY.current = currentScrollY;
      ticking.current = false;
    }

    function handleScroll() {
      if (!ticking.current) {
        window.requestAnimationFrame(updateHeader);
        ticking.current = true;
      }
    }

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex min-h-[var(--header-height)] items-center justify-between border-b border-foreground/10 bg-[var(--header-background)] px-site-x py-6 text-foreground transition-transform duration-300 ease-out md:py-8",
        hidden && "pointer-events-none -translate-y-full",
      )}
    >
      <StampLogo className="size-16 md:size-24" />
      <nav aria-label="Primary navigation" className="flex gap-7 text-lg md:text-2xl">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "underline-offset-8 transition-colors hover:text-muted-foreground",
              active === link.key && "underline decoration-2",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
