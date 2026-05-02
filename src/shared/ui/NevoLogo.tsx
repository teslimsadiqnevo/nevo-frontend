import Image from "next/image";
import logo from "@/shared/assets/default-logo.svg";

type NevoLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
  variant?: "default" | "light";
};

export function NevoLogo({
  className,
  width = 80,
  height = 24,
  alt = "Nevo",
  variant = "default",
}: NevoLogoProps) {
  const variantClassName =
    variant === "light"
      ? `brightness-0 invert ${className ?? ""}`.trim()
      : className;

  return (
    <Image
      src={logo}
      alt={alt}
      width={width}
      height={height}
      className={variantClassName}
      priority={false}
    />
  );
}