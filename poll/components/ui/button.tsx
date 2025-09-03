import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary";
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2",
  lg: "px-5 py-3 text-lg",
};

const variants = {
  default: "bg-[var(--sz-color-primary)] text-white hover:bg-[var(--sz-color-accent)]",
  secondary: "bg-gray-700 text-white hover:bg-gray-800",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "default", size = "md", ...rest },
  ref
) {
  return (
    <button ref={ref} className={cn("rounded transition", sizes[size], variants[variant], className)} {...rest} />
  );
});


