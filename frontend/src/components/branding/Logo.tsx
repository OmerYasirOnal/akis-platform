import { Link } from 'react-router-dom';
import { logoPath, logoPath2x, logoAlt } from '../../theme/brand';

interface LogoProps {
  /**
   * Size variant for the logo
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  
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
  };

  const logoElement = (
    <img
      src={logoPath}
      srcSet={logoPath2x ? `${logoPath} 1x, ${logoPath2x} 2x` : undefined}
      alt={logoAlt}
      className={`${sizeClasses[size]} ${className}`}
      style={{ padding: '8px 12px 8px 0' }} // Safe area: top/bottom 8px, right 12px
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

