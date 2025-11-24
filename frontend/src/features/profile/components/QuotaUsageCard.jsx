import React from "react";
import { Box, HStack, Icon, Progress, Stack, Text, usePrefersReducedMotion } from "@chakra-ui/react";
import { FiAlertTriangle } from "react-icons/fi";
import GlowingCard from "@ui/molecules/GlowingCard";
import PrimaryButton from "@ui/atoms/PrimaryButton";
import { colors, borderRadius, spacing, gradients } from "@theme/tokens";

function formatPercent(limit, used) {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function QuotaUsageCard({ quota, onPurchaseClick, isPaymentsEnabled }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  if (!quota) return null;
  const limitValue = quota.limit || quota.available;
  const percent = formatPercent(limitValue, quota.used);
  const isLow = quota.available <= Math.max(1, Math.round((limitValue || 0) * 0.2));

  return (
    <GlowingCard intensity="medium">
      <Stack spacing={5}>
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" rowGap={3}>
          <Stack spacing={1}>
            <Text fontSize="lg" fontWeight="bold">
              Квоты и использование
            </Text>
            <Text color={colors.text.tertiary} fontSize="sm">
              Осталось {quota.available} запусков из {limitValue}
            </Text>
          </Stack>
          {isPaymentsEnabled && (
            <PrimaryButton size="sm" onClick={onPurchaseClick}>
              Купить ещё
            </PrimaryButton>
          )}
        </HStack>

        <Box
          position="relative"
          borderRadius={borderRadius.xl}
          border="1px solid rgba(255,255,255,0.08)"
          bg="rgba(6,8,15,0.9)"
          p={{ base: spacing.md, md: spacing.lg }}
          overflow="hidden"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-40%",
            background: gradients.prism,
            opacity: 0.18,
            filter: "blur(70px)",
            animation: prefersReducedMotion ? "none" : "gradientOrbit 22s linear infinite",
          }}
        >
          <Stack spacing={3} position="relative" zIndex={1}>
            <Progress
              value={percent}
              borderRadius="full"
              h="16px"
              bg="rgba(255,255,255,0.08)"
              sx={{
                "& > div": {
                  background: isLow
                    ? "linear-gradient(90deg, #f97316, #fb923c)"
                    : "linear-gradient(90deg, #2f74ff, #8b5cf6)",
                  boxShadow: isLow
                    ? "0 0 15px rgba(249,115,22,0.45)"
                    : "0 0 20px rgba(47,116,255,0.45)",
                },
              }}
            />
            <HStack justify="space-between" fontSize="sm" color={colors.text.secondary}>
              <Text>Использовано: {quota.used}</Text>
              <Text>Доступно: {quota.available}</Text>
            </HStack>
          </Stack>
        </Box>

        <HStack spacing={4} flexWrap="wrap">
          <Box
            flex="1"
            minW="140px"
            p={4}
            borderRadius={borderRadius.lg}
            border="1px solid rgba(255,255,255,0.08)"
            bg="rgba(255,255,255,0.02)"
          >
            <Text fontSize="xs" letterSpacing="0.18em" textTransform="uppercase" color={colors.text.tertiary}>
              Израсходовано
            </Text>
            <Text fontSize="2xl" fontWeight={700}>
              {percent}%
            </Text>
          </Box>
          <Box
            flex="1"
            minW="140px"
            p={4}
            borderRadius={borderRadius.lg}
            border="1px solid rgba(255,255,255,0.08)"
            bg="rgba(255,255,255,0.02)"
          >
            <Text fontSize="xs" letterSpacing="0.18em" textTransform="uppercase" color={colors.text.tertiary}>
              Свободно
            </Text>
            <Text fontSize="2xl" fontWeight={700} color={isLow ? "#f97316" : colors.brand.primary}>
              {quota.available}
            </Text>
          </Box>
        </HStack>

        {isLow && (
          <HStack
            spacing={3}
            fontSize="sm"
            color="#fb923c"
            borderRadius={borderRadius.lg}
            border="1px solid rgba(251,146,60,0.4)"
            bg="rgba(251,146,60,0.08)"
            p={4}
          >
            <Icon as={FiAlertTriangle} />
            <Text>Лимит почти исчерпан. Пополните квоту заранее.</Text>
          </HStack>
        )}
      </Stack>
    </GlowingCard>
  );
}

export default QuotaUsageCard;
