import { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & { size?: number };

export function Avatar({ className, size = 36, ...rest }: Props) {
  return (
    <img
      className={cn("rounded-full object-cover", className)}
      style={{ width: size, height: size }}
      {...rest}
    />
  );
}


