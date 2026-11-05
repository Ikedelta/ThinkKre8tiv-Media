import React from 'react';

interface GhanaCediIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Custom Ghana Cedi (GH₵) Symbol Vector Icon
 * Clean, standard SVG representing the official Ghana currency symbol.
 */
export function GhanaCediIcon({ size = 18, className = '', ...props }: GhanaCediIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* C curve */}
      <path d="M17 6.5A7.5 7.5 0 1 0 17 17.5" />
      {/* Vertical stroke down the center */}
      <line x1="10.5" y1="3" x2="10.5" y2="21" />
    </svg>
  );
}

export default GhanaCediIcon;

