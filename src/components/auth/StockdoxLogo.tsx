import React from "react";

interface StockdoxLogoProps {
  variant?: "large" | "icon" | "monochrome" | "small-color" | "button-logo";
  className?: string;
}

export default function StockdoxLogo({ variant = "large", className = "" }: StockdoxLogoProps) {
  if (variant === "icon") {
    // Small icon variant using the user-provided high-res logo image
    return (
      <img
        src="/logo.png"
        alt="Stockdox Logo Icon"
        className={`w-10 h-10 object-contain rounded-xl select-none ${className}`}
      />
    );
  }

  if (variant === "button-logo") {
    // Clean SVG styled exactly for the yellow button:
    // Black heartbeat line, black outline dollar, black top-right plus, cyan bottom-left plus
    return (
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-14 h-9 select-none ${className}`}
      >
        {/* Black pulse line */}
        <path
          d="M 20 60 L 50 60 L 62 20 L 78 100 L 90 55 L 98 60 L 125 60 L 138 10 L 148 70 L 154 60 L 180 60"
          stroke="#000000"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cyan plus (bottom-left) */}
        <path
          d="M 68 102 L 68 114 M 62 108 L 74 108"
          stroke="#00E5FF"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Black plus (top-right) */}
        <path
          d="M 148 5 L 148 17 M 142 11 L 154 11"
          stroke="#000000"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Black Outlined Dollar Sign */}
        <text
          x="98"
          y="80"
          fill="none"
          stroke="#000000"
          strokeWidth="3.5"
          fontSize="56"
          fontWeight="900"
          fontFamily="'Inter', 'Arial Black', sans-serif"
          textAnchor="middle"
        >
          $
        </text>
      </svg>
    );
  }

  if (variant === "small-color") {
    // Transparent, colorful SVG version of the logo using correct green hex #00D600
    return (
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-14 h-9 select-none ${className}`}
      >
        {/* Green pulse line */}
        <path
          d="M 20 60 L 50 60 L 62 20 L 78 100 L 90 55 L 98 60 L 125 60 L 138 10 L 148 70 L 154 60 L 180 60"
          stroke="#00D600"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Pink plus (bottom-left) */}
        <path
          d="M 68 102 L 68 114 M 62 108 L 74 108"
          stroke="#D500F9"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Green plus (top-right) */}
          <path
            d="M 148 5 L 148 17 M 142 11 L 154 11"
            stroke="#00D600"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Dollar Sign */}
          <text
            x="98"
            y="80"
            fill="#FFA000"
            fontSize="56"
            fontWeight="900"
            fontFamily="'Inter', 'Arial Black', sans-serif"
            textAnchor="middle"
          >
            $
          </text>
        </svg>
      );
    }

  if (variant === "monochrome") {
    // Black monochrome version of the logo for placement inside the yellow button
    return (
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-14 h-9 select-none ${className}`}
      >
        {/* Black pulse line */}
        <path
          d="M 20 60 L 50 60 L 62 20 L 78 100 L 90 55 L 98 60 L 125 60 L 138 10 L 148 70 L 154 60 L 180 60"
          stroke="#000000"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Black plus (bottom-left) */}
        <path
          d="M 68 102 L 68 114 M 62 108 L 74 108"
          stroke="#000000"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Black plus (top-right) */}
        <path
          d="M 148 5 L 148 17 M 142 11 L 154 11"
          stroke="#000000"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Black Dollar Sign */}
        <text
          x="98"
          y="80"
          fill="#000000"
          fontSize="56"
          fontWeight="900"
          fontFamily="'Inter', 'Arial Black', sans-serif"
          textAnchor="middle"
        >
          $
        </text>
      </svg>
    );
  }

  // Large default variant using the user-provided high-res logo image
  return (
    <div className={`flex justify-center items-center py-4 select-none ${className}`}>
      <img
        src="/logo.png"
        alt="Stockdox Logo"
        className="w-36 h-36 object-contain rounded-3xl"
      />
    </div>
  );
}
