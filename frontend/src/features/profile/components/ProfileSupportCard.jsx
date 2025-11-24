import React from "react";
import { Box, Stack, Text, usePrefersReducedMotion } from "@chakra-ui/react";
import GlowingCard from "@ui/molecules/GlowingCard";
import PrimaryButton from "@ui/atoms/PrimaryButton";
import { colors, borderRadius, spacing, gradients } from "@theme/tokens";

function ProfileSupportCard({ email }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <GlowingCard intensity="subtle">
      <Stack spacing={4}>
        <Text fontSize="lg" fontWeight="bold">
          Поддержка и документы
        </Text>
        <Text color={colors.text.tertiary} fontSize="sm">
          Отвечаем на вопросы о квотах и профиле в рабочее время. Пока платежей нет — используйте почту.
        </Text>
        <Box
          borderRadius={borderRadius.xl}
          border="1px solid rgba(255,255,255,0.08)"
          bg="rgba(6,8,15,0.85)"
          p={{ base: spacing.md, md: spacing.lg }}
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-35%",
            background: gradients.midnightMesh,
            opacity: 0.35,
            filter: "blur(80px)",
            animation: prefersReducedMotion ? "none" : "gradientOrbit 30s linear infinite",
          }}
        >
          <Stack spacing={1} position="relative" zIndex={1}>
            <Text fontSize="sm" color={colors.text.tertiary}>
              Email для связи
            </Text>
            <Text fontSize="xl" fontWeight={700}>
              {email}
            </Text>
          </Stack>
        </Box>
        <PrimaryButton as="a" href={`mailto:${email}`} size="sm">
          Написать в поддержку
        </PrimaryButton>
      </Stack>
    </GlowingCard>
  );
}

export default ProfileSupportCard;
