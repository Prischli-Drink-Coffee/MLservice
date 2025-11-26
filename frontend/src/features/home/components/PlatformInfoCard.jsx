import React from "react";
import { Box, Divider, HStack, VStack, usePrefersReducedMotion } from "@chakra-ui/react";
import { Subtitle, Footnote } from "@ui/atoms/Typography";
import MLStats from "./MLStats";
import StatusBadge from "@ui/atoms/StatusBadge";
import { colors, gradients } from "@theme/tokens";
import useInteractiveGlow from "@hooks/useInteractiveGlow";

import { MotionBox } from "@ui/motionPrimitives";

/**
 * PlatformInfoCard - Widget displaying platform features and health status
 * @param {object} health - Health check data with 'ok' boolean
 */
function PlatformInfoCard({ health, isAuthenticated = false }) {
  const { glowRef, glowStyle, onGlowMouseMove, onGlowMouseLeave } = useInteractiveGlow();
  const prefersReducedMotion = usePrefersReducedMotion();

  const accent = "#2f74ff";
  const glowSecondary = "#8b5cf6";
  const glowTertiary = "#1dd1a1";

  const gradientCss = `radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%),
        ${accent} 0%,
        ${glowSecondary} 45%,
        ${glowTertiary} 80%)`;

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
        ref={glowRef}
        style={glowStyle}
        onMouseMove={onGlowMouseMove}
        onMouseLeave={onGlowMouseLeave}
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
        <Box
          position="relative"
          overflow="hidden"
          borderRadius="2xl"
          border="1px solid rgba(255,255,255,0.08)"
          bg={`linear-gradient(140deg, rgba(5,7,13,0.92), rgba(7,9,18,0.8)), ${gradients.midnightMesh}`}
          boxShadow="0 40px 80px rgba(0,0,0,0.55)"
          p={{ base: 4, md: 5 }}
          h="full"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-30%",
            background: gradients.horizon,
            opacity: 0.25,
            filter: "blur(90px)",
            animation: prefersReducedMotion ? "none" : "gradientOrbit 30s linear infinite",
          }}
          _after={{
            content: '""',
            position: "absolute",
            inset: "1px",
            borderRadius: "calc(32px - 6px)",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(125deg, rgba(255,255,255,0.06), transparent 55%)",
            opacity: 0.65,
            pointerEvents: "none",
          }}
        >
          <Box position="relative" zIndex={1}>
            <VStack align="stretch" spacing={4} h="full" padding={8}>
              {/* Title */}
              <Subtitle variant="medium" fontSize={{ base: "18px", md: "22px" }}>
                Статистика ML платформы
              </Subtitle>

              <Divider borderColor={colors.border.default} opacity={0.5} />

              {/* Health Status */}
              <HStack justify="space-between" align="center">
                <Footnote variant="small" color={colors.text.primary} fontSize="11px">
                  Статус сервера /api/health
                </Footnote>
                <StatusBadge ok={health?.ok} />
              </HStack>
              {!isAuthenticated && (
                <Footnote variant="small" color={colors.text.tertiary} fontSize="11px">
                  Авторизуйтесь, чтобы включить мониторинг и видеть актуальные обновления.
                </Footnote>
              )}
              {health?.error && (
                <Footnote variant="small" color={colors.text.tertiary} fontSize="11px">
                  {health.error}
                </Footnote>
              )}

              {/* ML Statistics */}
              <Divider borderColor={colors.border.default} opacity={0.5} />
              <VStack align="stretch" spacing={2}>
                <Box w="full" maxW={{ base: "full", lg: "900px" }}>
                  <MLStats isAuthenticated={isAuthenticated} />
                </Box>
              </VStack>
            </VStack>
          </Box>
        </Box>
      </MotionBox>
    </MotionBox>
  );
}

export default PlatformInfoCard;
