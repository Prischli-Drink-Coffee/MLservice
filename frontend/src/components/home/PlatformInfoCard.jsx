import React, { useMemo, useState } from "react";
import { Box, Divider, HStack, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Subtitle, Body, Footnote } from "../common/Typography";
// import LiveStats from "./LiveStats";
import StatusBadge from "../common/StatusBadge";
import { colors, spacing } from "../../theme/tokens";

const MotionBox = motion(Box);

/**
 * PlatformInfoCard - Widget displaying platform features and health status
 * @param {boolean} isAuthenticated - User authentication status
 * @param {object} health - Health check data with 'ok' boolean
 */
function PlatformInfoCard({ isAuthenticated, health }) {
  const [gradientPos, setGradientPos] = useState({ x: 50, y: 50 });

  const accent = "#2f74ff";
  const glowSecondary = "#8b5cf6";
  const glowTertiary = "#1dd1a1";

  const quickLinks = [
    { label: "Telegram", path: "/telegram" },
    { label: "Узлы", path: "/nodes" },
    { label: "Playground", path: "/playground" },
  ];

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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      w="full"
      h="full"
    >
      <MotionBox
        role="presentation"
        onMouseMove={handleMouseMove}
        initial={{ boxShadow: "0 0 18px rgba(47, 116, 255, 0.25)" }}
        whileHover={{ boxShadow: "0 0 28px rgba(139, 92, 246, 0.65)" }}
        transition={{ duration: 0.45 }}
        bg="transparent"
        borderRadius="2xl"
        position="relative"
        overflow="hidden"
        h="full"
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
      >
        <Box bg={colors.blur.dark} borderRadius="2xl" p={{ base: 4, md: 5 }} h="full">
          <VStack align="stretch" spacing={4} h="full">
            {/* Title */}
            <Subtitle variant="medium" fontSize={{ base: "18px", md: "22px" }}>
              Статус платформы
            </Subtitle>

            <Divider borderColor={colors.border.default} opacity={0.5} />

            {/* Health Status */}
            <HStack justify="space-between" align="center">
              <Footnote variant="small" color={colors.text.primary} fontSize="11px">
                Статус сервера /api/health
              </Footnote>
              <StatusBadge ok={health?.ok} />
            </HStack>

            {/* Дополнительно: место для будущей ML-статистики */}
            {/* <Divider borderColor={colors.border.default} opacity={0.5} />
            <VStack align="stretch" spacing={2}>
              <Box w="full" maxW={{ base: "full", lg: "900px" }}>
                <LiveStats />
              </Box>
            </VStack> */}
          </VStack>
        </Box>
      </MotionBox>
    </MotionBox>
  );
}

export default PlatformInfoCard;
