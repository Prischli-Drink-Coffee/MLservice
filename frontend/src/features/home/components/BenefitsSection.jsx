import React from "react";
import { Box, SimpleGrid, Stack, Icon, usePrefersReducedMotion } from "@chakra-ui/react";
import { MotionBox } from "@ui/motionPrimitives";
import { Subtitle, Body, Footnote } from "@ui/atoms/Typography";
import { colors, borderRadius, spacing, gradients } from "@theme/tokens";
import { CheckCircleIcon, TimeIcon, LockIcon, RepeatIcon } from "@chakra-ui/icons";
import { BENEFITS_CONTENT } from "@constants";

const iconMap = {
  CheckCircleIcon,
  TimeIcon,
  RepeatIcon,
  LockIcon,
};

const resolveIcon = (iconKey) => iconMap[iconKey] || CheckCircleIcon;

const resolveColor = (colorKey) => {
  if (!colorKey) return colors.brand.primary;
  if (colorKey.startsWith("#")) return colorKey;
  const parts = colorKey.split(".");
  return parts.reduce((acc, part) => (acc ? acc[part] : undefined), colors) || colorKey;
};

//
// code
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

function BenefitsSection() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Box
      w="full"
      position="relative"
      borderRadius={{ base: borderRadius.lg, md: borderRadius["2xl"] }}
      overflow="hidden"
      px={{ base: spacing.md, md: spacing.xl }}
      py={{ base: spacing.xl, md: spacing["3xl"] }}
      bg={`linear-gradient(145deg, rgba(4,6,12,0.92), rgba(7,9,18,0.75)), ${gradients.midnightMesh}`}
      border="1px solid rgba(255,255,255,0.06)"
      boxShadow="0 35px 80px rgba(3,4,8,0.65)"
      _before={{
        content: '""',
        position: "absolute",
        inset: "-30%",
        background: gradients.aurora,
        opacity: 0.35,
        filter: "blur(70px)",
        animation: prefersReducedMotion ? "none" : "glowPulse 16s ease-in-out infinite",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(120deg, rgba(255,255,255,0.05) 0%, transparent 45%)",
        opacity: 0.5,
        pointerEvents: "none",
      }}
    >
      <Stack spacing={{ base: 8, md: 10 }} align="center" position="relative" zIndex={1}>
        {/* Section Header */}
        <Stack spacing={3} align="center" textAlign="center" maxW="800px">
          <Footnote
            variant="medium"
            color={colors.brand.primary}
            textTransform="uppercase"
            letterSpacing="wider"
            fontWeight={600}
          >
            {BENEFITS_CONTENT.title}
          </Footnote>
          <Subtitle variant="large" fontSize={{ base: "26px", md: "32px" }}>
            {BENEFITS_CONTENT.subtitle}
          </Subtitle>
          <Body variant="medium" color={colors.text.tertiary} maxW="650px">
            {BENEFITS_CONTENT.description}
          </Body>
        </Stack>

        {/* Benefits Grid */}
        <MotionBox
          w="full"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 4, md: 5 }} w="full">
            {BENEFITS_CONTENT.items.map((benefit, index) => {
              const IconComponent = resolveIcon(benefit.icon);
              const benefitColor = resolveColor(benefit.color);
              return (
                <MotionBox
                  key={index}
                  variants={itemVariants}
                  whileHover={{
                    y: -8,
                    transition: { duration: 0.3 },
                  }}
                >
                  <Box
                    bg="rgba(6,8,15,0.9)"
                    borderRadius={borderRadius.xl}
                    p={{ base: 5, md: 6 }}
                    border="1px solid rgba(255,255,255,0.08)"
                    h="full"
                    position="relative"
                    overflow="hidden"
                    transition="all 0.35s ease"
                    backdropFilter="blur(24px)"
                    _hover={{
                      borderColor: benefitColor,
                      boxShadow: `0 25px 55px ${benefitColor}2a`,
                      transform: "translateY(-6px)",
                    }}
                    _before={{
                      content: '""',
                      position: "absolute",
                      inset: "-35%",
                      background: gradients.prism,
                      opacity: 0.25,
                      filter: "blur(60px)",
                      animation: prefersReducedMotion
                        ? "none"
                        : "gradientOrbit 22s linear infinite",
                    }}
                    _after={{
                      content: '""',
                      position: "absolute",
                      inset: "1px",
                      borderRadius: `calc(${borderRadius.xl} - 10px)`,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background:
                        "linear-gradient(145deg, rgba(255,255,255,0.08), transparent 60%)",
                      opacity: 0.7,
                      mixBlendMode: "screen",
                      pointerEvents: "none",
                      animation: prefersReducedMotion
                        ? "none"
                        : "shimmerTrail 9s ease-in-out infinite",
                    }}
                  >
                    <Stack spacing={3}>
                      {/* Icon */}
                      <Box
                        bg="rgba(255,255,255,0.04)"
                        borderRadius={borderRadius.lg}
                        p={3}
                        w="fit-content"
                        position="relative"
                        overflow="hidden"
                        _before={{
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          background: `linear-gradient(135deg, ${benefitColor} 0%, transparent 65%)`,
                          opacity: 0.65,
                        }}
                        _after={{
                          content: '""',
                          position: "absolute",
                          inset: "4px",
                          borderRadius: `calc(${borderRadius.lg} - 6px)`,
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <Icon
                          as={IconComponent}
                          boxSize={6}
                          color={benefitColor}
                          position="relative"
                        />
                      </Box>

                      {/* Title */}
                      <Subtitle variant="small" fontSize={{ base: "16px", md: "18px" }}>
                        {benefit.title}
                      </Subtitle>

                      {/* Description */}
                      <Body
                        variant="small"
                        color={colors.text.tertiary}
                        fontSize={{ base: "13px", md: "14px" }}
                        lineHeight="1.6"
                      >
                        {benefit.description}
                      </Body>
                    </Stack>
                  </Box>
                </MotionBox>
              );
            })}
          </SimpleGrid>
        </MotionBox>
      </Stack>
    </Box>
  );
}

export default BenefitsSection;
