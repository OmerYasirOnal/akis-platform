import { Link } from "react-router-dom";
import {
  LOGO_ALT,
  LOGO_PNG_HERO,
  LOGO_SIZES,
  type LogoSize,
} from "../../theme/brand";
import { cn } from "../../utils/cn";

interface LogoProps {
  /**
   * Logo boyutu
   * @default 'nav'
   */
  size?: LogoSize;
  /**
   * Logoyu ana sayfaya bağla
   * @default true
   */
  linkToHome?: boolean;
  /**
   * Ek CSS sınıfları
   */
  className?: string;
}

const LOGO_SRC = new URL(LOGO_PNG_HERO, import.meta.url).href;

export default function Logo({
  size = "nav",
  linkToHome = true,
  className,
}: LogoProps) {
  const height = LOGO_SIZES[size];

  const logoElement = (
    <img
      src={LOGO_SRC}
      alt={LOGO_ALT}
      className={cn("w-auto", className)}
      style={{ height: `${height}px` }}
      loading={size === "hero" ? "eager" : "lazy"}
      decoding="async"
    />
  );

  if (!linkToHome) {
    return logoElement;
  }

  return (
    <Link to="/" className="inline-flex items-center justify-center">
      {logoElement}
    </Link>
  );
}

