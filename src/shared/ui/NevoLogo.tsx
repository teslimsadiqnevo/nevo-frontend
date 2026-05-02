import Image from "next/image";
import logo from "@/shared/assets/default-logo.svg";

type NevoLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
};

export function NevoLogo({
  className,
  width = 80,
  height = 24,
  alt = "Nevo",
}: NevoLogoProps) {
  return (
    <Image
      src={logo}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={false}
    />
  );
}
