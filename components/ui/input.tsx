import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-14 w-full border-2 border-transparent border-b-input bg-transparent px-3 text-lg outline-none transition-colors placeholder:text-muted-foreground focus:border-ring",
        className,
      )}
      {...props}
    />
  );
}
