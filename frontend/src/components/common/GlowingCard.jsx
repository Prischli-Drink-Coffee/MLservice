import React, { useEffect, useMemo, useState } from "react";
import { Box } from "@chakra-ui/react";
import { motion, useAnimation } from "framer-motion";
import { colors, borderRadius } from "../../theme/tokens";

const MotionBox = motion(Box);

/**
 * GlowingCard - Card with animated gradient border and glow effect
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.intensity - Glow intensity: 'subtle' | 'medium' | 'strong'
 * @param {object} props.rest - Additional Box props
 */
export default function GlowingCard({ children, intensity = "medium", ...rest }) {
  const [gradientPos, setGradientPos] = useState({ x: 50, y: 50 });
  const controls = useAnimation();

  const accent = colors.brand.primary;
  const glowSecondary = colors.brand.secondary;
  const glowTertiary = colors.brand.tertiary;

  const intensityMap = {
    subtle: {
      boxShadow: "0 0 18px rgba(47, 116, 255, 0.15)",
      hoverShadow: "0 0 28px rgba(139, 92, 246, 0.45)",
    },
    medium: {
      boxShadow: "0 0 18px rgba(47, 116, 255, 0.25)",
      hoverShadow: "0 0 28px rgba(139, 92, 246, 0.65)",
    },
    strong: {
      boxShadow: "0 0 28px rgba(47, 116, 255, 0.35)",
      hoverShadow: "0 0 45px rgba(139, 92, 246, 0.85)",
    },
  };

  useEffect(() => {
    controls.start({
      x: [42, 58, 47, 60, 40, 50],
      y: [48, 52, 60, 40, 55, 50],
      transition: {
        repeat: Infinity,
        repeatType: "mirror",
        duration: 12,
        ease: "easeInOut",
      },
    });
  }, [controls]);

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
    <MotionBox
      role="presentation"
      onMouseMove={handleMouseMove}
      animate={controls}
      custom={gradientPos}
      initial={{
        boxShadow: intensityMap[intensity].boxShadow,
        scale: 1,
      }}
      whileHover={{
        boxShadow: intensityMap[intensity].hoverShadow,
        scale: 1.01,
      }}
      transition={{ duration: 0.45 }}
      bg="transparent"
      borderRadius={borderRadius.md}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        padding: "2px",
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
    </MotionBox>
  );
}
