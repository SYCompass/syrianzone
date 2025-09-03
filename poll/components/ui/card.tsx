import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cn("bg-white rounded-lg border shadow-sm", className)} {...props} />;
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cn("p-4 border-b", className)} {...props} />;
});

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cn("p-4", className)} {...props} />;
});


