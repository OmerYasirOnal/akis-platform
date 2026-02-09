import { Link } from "react-router-dom";
import {
  LOGO_ALT,
  LOGO_PNG_1X,
  LOGO_PNG_2X,
  LOGO_PNG_3X,
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

// LOGO_PNG_* are already resolved URLs (via import.meta.url in brand.ts)
const LOGO_SRCSET = `${LOGO_PNG_1X} 1x, ${LOGO_PNG_2X} 2x, ${LOGO_PNG_3X} 3x`;

export default function Logo({
  size = "nav",
  linkToHome = true,
  className,
}: LogoProps) {
  const height = LOGO_SIZES[size];
  const computedStyle =
    size === "hero"
      ? { height: "clamp(72px, 12vw, 112px)" }
      : { height: `${height}px` };

  const logoElement = (
    <img
      src={LOGO_PNG_1X}
      srcSet={LOGO_SRCSET}
      alt={LOGO_ALT}
      className={cn("w-auto", className)}
      style={computedStyle}
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

