import Link from "next/link";
import type { ReactNode } from "react";

type MarkdownTextProps = {
  value: string;
  className?: string;
  inline?: boolean;
};

const linkPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function isSafeHref(href: string) {
  return (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("mailto:")
  );
}

function renderInlineMarkdown(value: string): ReactNode[] {
  return value.split(linkPattern).map((part, index) => {
    if (!part) {
      return null;
    }

    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const labelEnd = part.indexOf("](");
      const label = part.slice(1, labelEnd);
      const href = part.slice(labelEnd + 2, -1);

      if (!isSafeHref(href)) {
        return label;
      }

      if (href.startsWith("/")) {
        return (
          <Link
            key={`${part}-${index}`}
            href={href}
            className="underline decoration-2 underline-offset-4"
          >
            {label}
          </Link>
        );
      }

      return (
        <a
          key={`${part}-${index}`}
          href={href}
          className="underline decoration-2 underline-offset-4"
          rel="noreferrer"
          target="_blank"
        >
          {label}
        </a>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

export function MarkdownText({ value, className, inline }: MarkdownTextProps) {
  if (inline) {
    return <span className={className}>{renderInlineMarkdown(value)}</span>;
  }

  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`} className={className}>
          {renderInlineMarkdown(paragraph)}
        </p>
      ))}
    </>
  );
}
