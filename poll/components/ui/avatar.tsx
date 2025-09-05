import Image from "next/image";
import { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & { size?: number };

export function Avatar({ className, size = 36, alt = "", ...rest }: Props) {
  return (
    <Image
      className={cn("rounded-full object-cover", className)}
      style={{ width: size, height: size }}
      width={size}
      height={size}
      alt={alt}
      {...rest}
    />
  );
}


