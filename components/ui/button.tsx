import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
};

const variants = {
  primary:
    "border-primary bg-primary text-primary-foreground hover:bg-cmm-charcoal",
  outline:
    "border-primary bg-background text-foreground hover:bg-secondary hover:text-secondary-foreground",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
};

const sizes = {
  default: "h-14 px-8 text-base",
  sm: "h-11 px-5 text-sm",
  lg: "h-16 px-10 text-lg",
};

export function Button({
  className,
  variant = "outline",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center border-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        "rounded-[var(--radius-button)]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
