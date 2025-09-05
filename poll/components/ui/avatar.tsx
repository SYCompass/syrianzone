import { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & { src?: string; size?: number };

export function Avatar({ className, size = 36, alt = "", src, ...rest }: Props) {
  return (
    <img
      className={cn("rounded-full object-cover", className)}
      style={{ width: size, height: size, WebkitUserDrag: "none", userSelect: "none" as const }}
      width={size}
      height={size}
      src={src ?? ""}
      alt={alt}
      crossOrigin="anonymous"
      loading="eager"
      decoding="sync"
      draggable={false}
      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
      {...rest}
    />
  );
}


