/**
 * Design System Tokens
 * Centralized design constants for TeleRAG platform
 * Based on provided design specification
 */

export const colors = {
  // Text colors
  text: {
    primary: "#ffffff",
    primaryInverted: "#050505",
    secondary: "rgba(255, 255, 255, 0.75)",
    tertiary: "rgba(255, 255, 255, 0.5)",
    quaternary: "rgba(255, 255, 255, 0.25)",
  },

  // Background colors
  background: {
    darkPrimary: "#050505",
    darkPrimary75: "rgba(5, 5, 5, 0.75)",
    darkPrimary50: "rgba(5, 5, 5, 0.5)",
    darkPrimary25: "rgba(5, 5, 5, 0.25)",
    buttonActive: "#ffffff",
    buttonDisabled: "rgba(255, 255, 255, 0.5)",
    chineseBlack10: "rgba(16, 16, 16, 0.1)",
    chineseBlack50: "rgba(16, 16, 16, 0.5)",
    jet50: "rgba(53, 53, 53, 0.5)",
  },

  // Blur backgrounds
  blur: {
    dark: "rgba(21, 21, 21, 0.75)",
    mid: "rgba(53, 53, 53, 0.75)",
    light: "rgba(21, 21, 21, 0.5)",
    accent: "rgba(80, 80, 80, 0.75)",
  },

  // Border colors
  border: {
    default: "rgba(255, 255, 255, 0.05)",
    subtle: "rgba(255, 255, 255, 0.08)",
    medium: "rgba(255, 255, 255, 0.12)",
    light: "rgba(255, 255, 255, 0.15)",
  },

  // Brand accent colors
  brand: {
    primary: "#2f74ff",
    secondary: "#8b5cf6",
    tertiary: "#1dd1a1",
  },

  // Status colors
  success: "#10b981", // green
  error: "#ef4444", // red
  warning: "#f59e0b", // orange
};

export const typography = {
  fontFamily: {
    primary: "'Involve', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  },

  // Title styles
  title: {
    large: {
      fontSize: "30px",
      lineHeight: "115%",
      fontWeight: 500,
    },
    medium: {
      fontSize: "24px",
      lineHeight: "125%",
      fontWeight: 500,
    },
    small: {
      fontSize: "22px",
      lineHeight: "115%",
      fontWeight: 500,
    },
  },

  // Subtitle styles
  subtitle: {
    large: {
      fontSize: "20px",
      lineHeight: "125%",
      fontWeight: 500,
    },
    medium: {
      fontSize: "16px",
      lineHeight: "125%",
      fontWeight: 500,
    },
  },

  // Body text styles
  body: {
    large: {
      fontSize: "18px",
      lineHeight: "150%",
      fontWeight: 500,
    },
    medium: {
      fontSize: "14px",
      lineHeight: "140%",
      fontWeight: 500,
    },
  },

  // Footnote styles
  footnote: {
    medium: {
      fontSize: "14px",
      lineHeight: "107%",
      fontWeight: 500,
    },
    small: {
      fontSize: "12px",
      lineHeight: "125%",
      fontWeight: 500,
    },
  },
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
  "4xl": "40px",
  "5xl": "48px",
  "6xl": "64px",
};

export const borderRadius = {
  sm: "10px",
  md: "15px",
  lg: "20px",
  xl: "25px",
  full: "9999px",
};

export const borderWidth = {
  default: "1px",
  medium: "2px",
  thick: "3px",
};

export const blur = {
  strength: {
    default: "25px",
    light: "15px",
    heavy: "40px",
  },
};

export const shadows = {
  subtle: "0 1px 4px rgba(0, 0, 0, 0.12)",
  elevated: "0 12px 32px rgba(0, 0, 0, 0.32)",
  glow: "0 0 28px rgba(139, 92, 246, 0.65)",
  glowSubtle: "0 0 18px rgba(47, 116, 255, 0.25)",
};

export const transitions = {
  default: "0.2s ease",
  smooth: "0.3s ease-in-out",
  slow: "0.5s ease",
};

export const breakpoints = {
  mobile: "320px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1280px",
};

export const dimensions = {
  iconButton: {
    width: "40px",
    height: "40px",
  },
  button: {
    heightMobile: "45px",
    heightDesktop: "50px",
  },
};

// Default export as unified tokens object
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  blur,
  shadows,
  transitions,
  breakpoints,
  dimensions,
};
