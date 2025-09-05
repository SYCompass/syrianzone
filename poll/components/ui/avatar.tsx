import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "src" | "width" | "height" | "fill"> & { src?: string; size?: number };

export function Avatar({ className, size = 36, alt = "", src, ...rest }: Props) {
  return (
    <Image
      className={cn("rounded-full object-cover", className)}
      style={{ width: size, height: size }}
      width={size}
      height={size}
      src={src ?? ""}
      alt={alt}
      {...rest}
    />
  );
}


