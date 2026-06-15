import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-36 w-full resize-y border-2 border-transparent border-b-input bg-transparent px-3 py-3 text-lg outline-none transition-colors placeholder:text-muted-foreground focus:border-ring",
        className,
      )}
      {...props}
    />
  );
}
