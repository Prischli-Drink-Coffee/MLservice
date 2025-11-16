import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Divider,
  Flex,
  HStack,
  Progress,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { getMetricsSummary } from "../../API/metrics";
import { colors, borderRadius, spacing } from "../../theme/tokens";

const MiniStatCard = ({ label, value, suffix = "" }) => (
  <Flex
    direction="column"
    justify="center"
    align="center"
    bg={colors.background.jet30}
    borderRadius={borderRadius.xl}
    border={`1px solid ${colors.border.default}`}
    px={{ base: spacing[3], md: spacing[4] }}
    py={{ base: spacing[3], md: spacing[4] }}
    textAlign="center"
    gap={2}
    minH="96px"
  >
    <Text
      fontSize="xs"
      color={colors.text.secondary}
      textTransform="uppercase"
      letterSpacing="0.12em"
      noOfLines={2}
    >
      {label}
    </Text>
    <HStack spacing={2} align="flex-end" justify="center">
      <Text fontSize="2xl" fontWeight={700} color={colors.text.primary} lineHeight="1">
        {value}
      </Text>
      {suffix && (
        <Text fontSize="md" color={colors.text.secondary} fontWeight={600} pb="2px">
          {suffix}
        </Text>
      )}
    </HStack>
  </Flex>
);

const DistributionChart = ({ title, subtitle, bins, color }) => {
  const maxValue = Math.max(...bins.map((bin) => bin.value), 1);
  const total = bins.reduce((sum, bin) => sum + bin.value, 0);

  return (
    <Stack spacing={5} bg={colors.background.jet30} borderRadius={borderRadius.xl} p={{ base: spacing[4], md: spacing[5] }}>
      <Stack spacing={2}>
        <HStack justify="space-between" align="center" spacing={4} wrap="wrap">
          <Text fontSize="lg" fontWeight={600} color={colors.text.primary}>
            {title}
          </Text>
          <Badge bg={colors.background.jet50} color={colors.text.secondary} borderRadius="full" px={3} py={1} fontSize="xs">
            {total || 0} запусков
          </Badge>
        </HStack>
        {subtitle && (
          <Text fontSize="sm" color={colors.text.secondary}>
            {subtitle}
          </Text>
        )}
      </Stack>
      <Box position="relative" w="full">
        <Box
          display="flex"
          alignItems="flex-end"
          gap={4}
          w="full"
          overflowX="auto"
          pb={3}
          pt={1}
          minH={{ base: "210px", md: "240px" }}
        >
          {bins.map((bin) => {
            const barHeight = (bin.value / maxValue) * 100;
            return (
              <Tooltip key={bin.label} label={`${bin.label}: ${bin.value}`} openDelay={200} hasArrow>
                <Stack spacing={2} minW="64px" align="center" flexShrink={0}>
                  <Box
                    w="100%"
                    borderRadius="xl"
                    bg={color}
                    minH="6px"
                    height={`${barHeight || 4}%`}
                    boxShadow={`0 10px 25px ${color}40`}
                    transition="height 0.3s ease"
                  />
                  <Text
                    fontSize="xs"
                    color={colors.text.secondary}
                    textAlign="center"
                    px={1}
                    whiteSpace="normal"
                    noOfLines={2}
                  >
                    {bin.label}
                  </Text>
                  <Badge
                    bg={colors.background.jet50}
                    color={colors.text.primary}
                    borderRadius="md"
                    px={2}
                    py={0.5}
                    fontSize="xs"
                  >
                    {bin.value}
                  </Badge>
                </Stack>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
};

const buildAccuracyBins = (trends) => {
  const bins = Array.from({ length: 10 }, (_, idx) => ({
    label: `${idx * 10}-${(idx + 1) * 10}%`,
    value: 0,
  }));
  trends.forEach((point) => {
    const accuracy = point.metrics?.accuracy;
    if (typeof accuracy === "number") {
      const clamped = Math.max(0, Math.min(accuracy, 1));
      const index = Math.min(bins.length - 1, Math.floor(clamped * 10));
      bins[index].value += 1;
    }
  });
  return bins;
};

const buildR2Bins = (trends) => {
  const boundaries = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1];
  const bins = Array.from({ length: boundaries.length - 1 }, (_, idx) => {
    const start = boundaries[idx];
    const end = boundaries[idx + 1];
    const isLast = idx === boundaries.length - 2;
    const startLabel = start === 0 ? "0" : start.toFixed(1);
    const endLabel = end === 0 ? "0" : end.toFixed(1);
    return {
      label: isLast ? `до ${endLabel}` : `${startLabel} – ${endLabel}`,
      range: { start, end, inclusiveEnd: isLast },
      value: 0,
    };
  });
  trends.forEach((point) => {
    const r2 = point.metrics?.r2;
    if (typeof r2 === "number") {
      const normalized = Math.max(-1, Math.min(r2, 1));
      const bin = bins.find(({ range }) =>
        range.inclusiveEnd
          ? normalized >= range.start && normalized <= range.end
          : normalized >= range.start && normalized < range.end,
      );
      if (bin) {
        bin.value += 1;
      }
    }
  });
  return bins;
};

export default function AuthenticatedMetricsDistributions() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getMetricsSummary({ limit: 200 })
      .then((data) => {
        if (mounted) {
          setMetrics(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load metrics summary", error);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const aggregates = useMemo(() => metrics?.aggregates ?? {}, [metrics]);
  const trends = useMemo(() => metrics?.trends ?? [], [metrics]);

  const classificationCount = aggregates.classification_count || 0;
  const regressionCount = aggregates.regression_count || 0;
  const totalRuns = classificationCount + regressionCount;

  const accuracyBins = useMemo(() => buildAccuracyBins(trends), [trends]);
  const r2Bins = useMemo(() => buildR2Bins(trends), [trends]);

  return (
    <VStack spacing={8} w="full" padding={4}>
      {isLoading ? (
        <Spinner size="lg" />
      ) : (
        <Stack spacing={6} w="full">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full" alignItems="stretch">
            <MiniStatCard label="Всего запусков" value={totalRuns || 0} />
            <MiniStatCard
              label="Средняя точность"
              value={((aggregates.avg_accuracy ?? 0) * 100).toFixed(1)}
              suffix="%"
            />
            <MiniStatCard
              label="Средний R²"
              value={((aggregates.avg_r2 ?? 0) * 100).toFixed(1)}
              suffix="%"
            />
          </SimpleGrid>

          <SimpleGrid columns={1} spacing={6} w="full" padding={4}>
            <DistributionChart
              title="Распределение точности"
              subtitle="Каждый столбец показывает долю запусков, попавших в диапазон точности"
              bins={accuracyBins}
              color={colors.brand.primary}
            />
            <DistributionChart
              title="Распределение R²"
              subtitle="Диапазоны покрывают весь допустимый интервал коэффициента детерминации"
              bins={r2Bins}
              color={colors.brand.secondary}
            />
          </SimpleGrid>

          <Stack
            spacing={5}
            borderRadius={borderRadius.xl}
            border={`1px solid ${colors.border.default}`}
            bg={colors.background.jet30}
            px={{ base: spacing[4], md: spacing[5] }}
            py={{ base: spacing[4], md: spacing[5] }}
            padding={8}
          >
            <HStack justify="space-between" align="center" flexWrap="wrap" rowGap={2}>
              <Text fontSize="lg" fontWeight={600} color={colors.text.primary}>
                Баланс задач
              </Text>
              <Text fontSize="sm" color={colors.text.secondary}>
                {totalRuns} запусков
              </Text>
            </HStack>
            <Progress
              value={totalRuns ? (classificationCount / totalRuns) * 100 : 0}
              bg={colors.background.jet40}
              borderRadius="full"
              h="12px"
              sx={{
                "& > div": {
                  background: `linear-gradient(90deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
                },
              }}
            />
            <Flex direction={{ base: "column", md: "row" }} gap={4} justify="space-between" align="stretch">
              <Box flex="1">
                <Text fontSize="sm" color={colors.text.secondary} mb={1}>
                  Классификация
                </Text>
                <Text fontSize="2xl" fontWeight={700} color={colors.brand.primary}>
                  {classificationCount}
                </Text>
              </Box>
              <Divider orientation={{ base: "horizontal", md: "vertical" }} opacity={0.2} />
              <Box flex="1">
                <Text fontSize="sm" color={colors.text.secondary} mb={1}>
                  Регрессия
                </Text>
                <Text fontSize="2xl" fontWeight={700} color={colors.brand.secondary}>
                  {regressionCount}
                </Text>
              </Box>
            </Flex>
          </Stack>
        </Stack>
      )}
    </VStack>
  );
}
