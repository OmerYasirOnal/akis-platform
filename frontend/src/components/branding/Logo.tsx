import { Link } from 'react-router-dom';
import {
  AKIS_LOGO_ALT,
  AKIS_LOGO_URL,
  AKIS_LOGO_2X_URL,
} from '../../theme/brand';

interface LogoProps {
  /**
   * Size variant for the logo
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg' | 'hero';
  
  /**
   * Whether to wrap the logo in a Link to home
   * @default true
   */
  linkToHome?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * AKIS Logo Component
 * 
 * Renders the official AKIS logo with transparent background.
 * Default size: ~24-28px height on desktop, ~20-24px on mobile.
 * Respects safe area around the mark (≥ 8-12px padding).
 */
export default function Logo({ 
  size = 'default', 
  linkToHome = true,
  className = '' 
}: LogoProps) {
  // Size classes: sm ~20px, default ~24-28px, lg ~36px
  const sizeClasses = {
    sm: 'h-5 w-auto',      // ~20px mobile
    default: 'h-7 w-auto',  // ~28px desktop (24-28px range)
    lg: 'h-9 w-auto',       // ~36px large
    hero: 'h-28 w-auto sm:h-32', // ~112-128px hero
  };

  const paddingClass = size === 'hero' ? '' : 'py-2 pr-4';

  const logoElement = (
    <img
      src={AKIS_LOGO_URL}
      srcSet={AKIS_LOGO_2X_URL ? `${AKIS_LOGO_URL} 1x, ${AKIS_LOGO_2X_URL} 2x` : undefined}
      alt={AKIS_LOGO_ALT}
      className={`${sizeClasses[size]} ${paddingClass} ${className}`.trim()}
      loading="lazy"
    />
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-flex items-center">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}

