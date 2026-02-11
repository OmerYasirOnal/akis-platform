import { Link } from "react-router-dom";
import {
  LOGO_A_MARK_PNG,
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
      ? { height: "clamp(80px, 14vw, 120px)" }
      : { height: `${height}px` };
  const useMonogram = size !== "hero";
  const src = useMonogram ? LOGO_A_MARK_PNG : LOGO_PNG_1X;
  const srcSet = useMonogram ? undefined : LOGO_SRCSET;

  const logoElement = (
    <img
      src={src}
      srcSet={srcSet}
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
