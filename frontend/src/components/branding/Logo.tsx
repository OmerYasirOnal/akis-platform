import * as React from "react";
import logoPng from "../../assets/branding/akis-logo.png";

type Size = "sm" | "md" | "lg";

export const Logo: React.FC<{ size?: Size; className?: string }> = ({
  size = "md",
  className = "",
}) => {
  const h = size === "lg" ? "h-14" : size === "sm" ? "h-6" : "h-8";
  return (
    <img
      src={logoPng}
      alt="AKIS"
      className={`${h} w-auto select-none ${className}`}
      draggable={false}
    />
  );
};

export default Logo;
