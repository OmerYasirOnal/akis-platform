import { Link } from 'react-router-dom';
// Placeholder SVG - Replace with official PNG: akis-logo.png
import logoImage from '../assets/branding/akis-logo.svg';

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
 * Respects safe area around the mark (≥ 8px padding).
 */
export default function Logo({ 
  size = 'default', 
  linkToHome = true,
  className = '' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    default: 'h-8 w-auto',
    lg: 'h-12 w-auto',
  };

  const logoElement = (
    <img
      src={logoImage}
      alt="AKIS Platform"
      className={`${sizeClasses[size]} ${className}`}
      style={{ padding: '8px 0' }}
    />
  );

  if (linkToHome) {
    return (
      <Link to="/jobs" className="inline-flex items-center">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}

