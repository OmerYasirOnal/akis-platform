import React from "react";

type LogoVariant =
  | "stacked"
  | "stacked-dark"
  | "horizontal"
  | "horizontal-dark"
  | "icon"
  | "icon-dark"
  | "flat"
  | "mono";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  alt?: string;
}

const LOGO_SRC: Record<LogoVariant, string> = {
  stacked: "/brand/akis-logo.png",
  "stacked-dark": "/brand/akis-logo-dark.png",
  horizontal: "/brand/akis-logo-horizontal.png",
  "horizontal-dark": "/brand/akis-logo-horizontal-dark.png",
  icon: "/brand/akis-icon.png",
  "icon-dark": "/brand/akis-icon-dark.png",
  flat: "/brand/akis-logo-flat.png",
  mono: "/brand/akis-logo-mono.png",
};

export const Logo: React.FC<LogoProps> = ({
  variant = "stacked",
  className = "",
  alt = "AKIS",
}) => {
  const src = LOGO_SRC[variant];

  return <img src={src} alt={alt} className={className} loading="lazy" />;
};