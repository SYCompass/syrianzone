import { ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
};

const sizes = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2",
  lg: "px-5 py-3 text-lg",
  icon: "h-9 w-9 inline-flex items-center justify-center",
};

const variants = {
  default: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
  secondary: "bg-gray-700 text-white hover:bg-gray-800",
  outline: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "default", size = "md", asChild = false, ...rest },
  ref
) {
  const Comp = (asChild ? Slot : "button") as React.ElementType;
  return (
    <Comp ref={ref} className={cn("rounded transition cursor-pointer disabled:cursor-not-allowed", sizes[size], variants[variant], className)} {...rest} />
  );
});


