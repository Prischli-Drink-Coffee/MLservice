import React, { useMemo, useState } from "react";
import { Box } from "@chakra-ui/react";
import { colors, borderRadius } from "../../theme/tokens";

/**
 * GlowingCard - Card with animated gradient border and glow effect
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.intensity - Glow intensity: 'subtle' | 'medium' | 'strong'
 * @param {object} props.rest - Additional Box props
 */
export default function GlowingCard({ children, intensity = "medium", ...rest }) {
  const [gradientPos, setGradientPos] = useState({ x: 50, y: 50 });

  const accent = colors.brand.primary;
  const glowSecondary = colors.brand.secondary;
  const glowTertiary = colors.brand.tertiary;

  const intensityMap = {
    subtle: {
      boxShadow: "0 0 18px rgba(47, 116, 255, 0.15)",
      hoverShadow: "0 0 28px rgba(139, 92, 246, 0.45)",
      borderWidth: "3px",
    },
    medium: {
      boxShadow: "0 0 18px rgba(47, 116, 255, 0.25)",
      hoverShadow: "0 0 28px rgba(139, 92, 246, 0.65)",
      borderWidth: "5px",
    },
    strong: {
      boxShadow: "0 0 28px rgba(47, 116, 255, 0.35)",
      hoverShadow: "0 0 45px rgba(139, 92, 246, 0.85)",
      borderWidth: "7px",
    },
  };

  const gradientCss = useMemo(
    () =>
      `radial-gradient(circle at ${gradientPos.x}% ${gradientPos.y}%,
          ${accent} 0%,
          ${glowSecondary} 45%,
          ${glowTertiary} 80%)`,
    [accent, glowSecondary, glowTertiary, gradientPos.x, gradientPos.y],
  );

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setGradientPos({ x, y });
  };

  return (
    <Box
      role="presentation"
      onMouseMove={handleMouseMove}
      bg="transparent"
      borderRadius={borderRadius.md}
      position="relative"
      overflow="hidden"
      boxShadow={intensityMap[intensity].boxShadow}
      transition="box-shadow 0.35s ease, transform 0.35s ease"
      _hover={{ boxShadow: intensityMap[intensity].hoverShadow, transform: "translateY(-2px)" }}
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        padding: intensityMap[intensity].borderWidth,
        background: gradientCss,
        backgroundSize: "200% 200%",
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
        transition: "background 0.3s ease",
      }}
      {...rest}
    >
      <Box
        position="relative"
        bg={colors.blur.dark}
        backdropFilter="blur(25px)"
        borderRadius={borderRadius.md}
        p={{ base: 5, md: 6 }}
        h="full"
      >
        {children}
      </Box>
    </Box>
  );
}
