import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Progress,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
  Text,
  Tooltip,
  VStack,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { getMetricsSummary } from "@api/metrics";
import { colors, borderRadius, spacing, gradients } from "@theme/tokens";
import extractErrorInfo from "@utils/errorHandler";

const MiniStatCard = ({ label, value, suffix = "" }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius={borderRadius.xl}
      border="1px solid rgba(255,255,255,0.08)"
      bg={`linear-gradient(145deg, rgba(5,7,13,0.95), rgba(7,9,18,0.82)), ${gradients.midnightMesh}`}
      px={{ base: spacing.md, md: spacing.lg }}
      py={{ base: spacing.md, md: spacing.lg }}
      textAlign="center"
      minH="110px"
      _before={{
        content: '""',
        position: "absolute",
        inset: "-40%",
        background: gradients.prism,
        opacity: 0.25,
        filter: "blur(80px)",
        animation: prefersReducedMotion ? "none" : "gradientOrbit 24s linear infinite",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: "1px",
        borderRadius: `calc(${borderRadius.xl} - 8px)`,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(125deg, rgba(255,255,255,0.08), transparent 55%)",
        opacity: 0.6,
        pointerEvents: "none",
      }}
    >
      <Flex direction="column" justify="center" align="center" gap={3} position="relative" zIndex={1}>
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
    </Box>
  );
};

const DistributionChart = ({ title, subtitle, bins, color }) => {
  const maxValue = Math.max(...bins.map((bin) => bin.value), 1);
  const total = bins.reduce((sum, bin) => sum + bin.value, 0);
  const hasData = total > 0;

  return (
    <Stack
      spacing={5}
      position="relative"
      overflow="hidden"
      borderRadius={borderRadius.xl}
      p={{ base: spacing.lg, md: spacing.xl }}
      border="1px solid rgba(255,255,255,0.08)"
      bg={`linear-gradient(150deg, rgba(5,7,13,0.92), rgba(7,9,18,0.85)), ${gradients.midnightMesh}`}
      boxShadow="0 35px 70px rgba(0,0,0,0.55)"
      _before={{
        content: '""',
        position: "absolute",
        inset: "-35%",
        background: gradients.aurora,
        opacity: 0.2,
        filter: "blur(100px)",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: "1px",
        borderRadius: `calc(${borderRadius.xl} - 8px)`,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(120deg, rgba(255,255,255,0.08), transparent 55%)",
        opacity: 0.5,
        pointerEvents: "none",
      }}
    >
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
      <Box position="relative" w="full" zIndex={1}>
        {hasData ? (
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
                      bg={`linear-gradient(180deg, ${color}, rgba(255,255,255,0.05))`}
                      minH="6px"
                      height={`${barHeight || 4}%`}
                      boxShadow={`0 25px 55px ${color}33`}
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
        ) : (
          <Box
            w="full"
            minH="180px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px dashed"
            borderColor={colors.border.default}
            borderRadius={borderRadius.xl}
            bg={colors.background.jet30}
          >
            <Text fontSize="sm" color={colors.text.secondary} textAlign="center">
              Данных для построения распределения пока нет
            </Text>
          </Box>
        )}
      </Box>
    </Stack>
  );
};

const StatsSkeleton = () => (
  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
    {Array.from({ length: 3 }).map((_, idx) => (
      <Box
        key={`stat-skeleton-${idx}`}
        position="relative"
        overflow="hidden"
        borderRadius={borderRadius.xl}
        border="1px solid rgba(255,255,255,0.08)"
        bg="rgba(5,7,13,0.85)"
        px={{ base: spacing.md, md: spacing.lg }}
        py={{ base: spacing.lg, md: spacing.xl }}
        _before={{
          content: '""',
          position: "absolute",
          inset: "-30%",
          background: gradients.midnightMesh,
          opacity: 0.25,
          filter: "blur(80px)",
        }}
      >
        <Skeleton height="20px" w="60%" mx="auto" mb={4} />
        <Skeleton height="32px" w="50%" mx="auto" />
      </Box>
    ))}
  </SimpleGrid>
);

const ChartSkeleton = () => (
  <Stack
    spacing={4}
    position="relative"
    overflow="hidden"
    bg="rgba(5,7,13,0.85)"
    borderRadius={borderRadius.xl}
    p={{ base: spacing.lg, md: spacing.xl }}
    border="1px solid rgba(255,255,255,0.08)"
    _before={{
      content: '""',
      position: "absolute",
      inset: "-35%",
      background: gradients.dusk,
      opacity: 0.25,
      filter: "blur(90px)",
    }}
  >
    <Skeleton height="20px" w="40%" />
    <SkeletonText noOfLines={2} spacing="3" />
    <SimpleGrid columns={{ base: 6, md: 10 }} spacing={3} pt={2}>
      {Array.from({ length: 10 }).map((_, idx) => (
        <Skeleton key={`chart-skeleton-${idx}`} height={`${60 + (idx % 3) * 10}px`} borderRadius="xl" />
      ))}
    </SimpleGrid>
  </Stack>
);

const BalanceSkeleton = () => (
  <Stack
    spacing={4}
    position="relative"
    overflow="hidden"
    borderRadius={borderRadius.xl}
    border="1px solid rgba(255,255,255,0.08)"
    bg="rgba(5,7,13,0.85)"
    px={{ base: spacing.lg, md: spacing.xl }}
    py={{ base: spacing.lg, md: spacing.xl }}
    _before={{
      content: '""',
      position: "absolute",
      inset: "-35%",
      background: gradients.prism,
      opacity: 0.2,
      filter: "blur(80px)",
    }}
  >
    <Skeleton height="18px" w="30%" />
    <Skeleton height="12px" borderRadius="full" />
    <SkeletonText noOfLines={2} spacing="4" />
  </Stack>
);

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
  const [errorMessage, setErrorMessage] = useState(null);
  const fetchRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    let mounted = true;

    const loadMetrics = async () => {
      if (!mounted) return;
      setIsLoading(true);
      try {
        const data = await getMetricsSummary({ limit: 200 });
        if (!mounted) return;
        setMetrics(data);
        setErrorMessage(null);
      } catch (error) {
        if (!mounted) return;
        const { userMessage } = extractErrorInfo(error, {
          fallbackMessage: "Не удалось загрузить агрегированные метрики",
        });
        setErrorMessage(userMessage);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };

    fetchRef.current = loadMetrics;
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleRetry = () => {
    if (fetchRef.current) {
      fetchRef.current();
    }
  };

  const aggregates = useMemo(() => metrics?.aggregates ?? {}, [metrics]);
  const trends = useMemo(() => metrics?.trends ?? [], [metrics]);
  const classificationCount = aggregates.classification_count || 0;
  const regressionCount = aggregates.regression_count || 0;
  const totalRuns = classificationCount + regressionCount;
  const accuracyBins = useMemo(() => buildAccuracyBins(trends), [trends]);
  const r2Bins = useMemo(() => buildR2Bins(trends), [trends]);
  const showSkeleton = isLoading && !metrics;

  return (
    <VStack
      spacing={8}
      w="full"
      position="relative"
      borderRadius={{ base: borderRadius.lg, md: borderRadius["2xl"] }}
      overflow="hidden"
      px={{ base: spacing.md, md: spacing.xl }}
      py={{ base: spacing.xl, md: spacing["3xl"] }}
      bg={`linear-gradient(150deg, rgba(4,6,12,0.95), rgba(7,9,18,0.85)), ${gradients.midnightMesh}`}
      border="1px solid rgba(255,255,255,0.06)"
      boxShadow="0 40px 90px rgba(0,0,0,0.6)"
      _before={{
        content: '""',
        position: "absolute",
        inset: "-30%",
        background: gradients.aurora,
        opacity: 0.25,
        filter: "blur(120px)",
        animation: prefersReducedMotion ? "none" : "glowPulse 18s ease-in-out infinite",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(120deg, rgba(255,255,255,0.04), transparent 45%)",
        opacity: 0.6,
        pointerEvents: "none",
      }}
    >
      {errorMessage && (
        <Alert
          status="error"
          variant="left-accent"
          borderRadius={borderRadius.lg}
          bg="rgba(127,29,29,0.12)"
          border="1px solid rgba(239,68,68,0.45)"
          backdropFilter="blur(12px)"
          boxShadow="0 25px 40px rgba(239,68,68,0.15)"
        >
          <AlertIcon />
          <Flex w="full" justify="space-between" align="center" gap={4} flexWrap="wrap">
            <AlertDescription color={colors.text.primary} flex="1">
              {errorMessage}
            </AlertDescription>
            <Button size="sm" onClick={handleRetry} variant="outline" colorScheme="red">
              Повторить
            </Button>
          </Flex>
        </Alert>
      )}

      {showSkeleton ? (
        <Stack spacing={6} w="full">
          <StatsSkeleton />
          <SimpleGrid columns={1} spacing={6} w="full" padding={4}>
            <ChartSkeleton />
            <ChartSkeleton />
          </SimpleGrid>
          <BalanceSkeleton />
        </Stack>
      ) : metrics ? (
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

          <SimpleGrid columns={1} spacing={6} w="full" px={{ base: 0, md: 2 }}>
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
            position="relative"
            overflow="hidden"
            borderRadius={borderRadius.xl}
            border="1px solid rgba(255,255,255,0.08)"
            bg={`linear-gradient(140deg, rgba(5,7,13,0.92), rgba(7,9,18,0.85)), ${gradients.dusk}`}
            px={{ base: spacing.lg, md: spacing.xl }}
            py={{ base: spacing.lg, md: spacing.xl }}
            _before={{
              content: '""',
              position: "absolute",
              inset: "-40%",
              background: gradients.horizon,
              opacity: 0.2,
              filter: "blur(80px)",
            }}
            _after={{
              content: '""',
              position: "absolute",
              inset: "1px",
              borderRadius: `calc(${borderRadius.xl} - 10px)`,
              border: "1px solid rgba(255,255,255,0.08)",
              opacity: 0.6,
              pointerEvents: "none",
            }}
          >
            <Box position="relative" zIndex={1}>
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
            </Box>
          </Stack>
        </Stack>
      ) : (
        <Box
          w="full"
          position="relative"
          overflow="hidden"
          borderRadius={borderRadius.xl}
          border="1px dashed rgba(255,255,255,0.15)"
          bg="rgba(5,7,13,0.85)"
          px={{ base: spacing.lg, md: spacing.xl }}
          py={{ base: spacing.lg, md: spacing.xl }}
          textAlign="center"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-30%",
            background: gradients.midnightMesh,
            opacity: 0.35,
            filter: "blur(90px)",
          }}
          _after={{
            content: '""',
            position: "absolute",
            inset: "1px",
            borderRadius: `calc(${borderRadius.xl} - 8px)`,
            border: "1px solid rgba(255,255,255,0.08)",
            opacity: 0.5,
          }}
        >
          <Text fontSize="md" color={colors.text.secondary} mb={4}>
            Пока нет запусков, которые можно проанализировать.
          </Text>
          <Button size="sm" onClick={handleRetry} variant="outline">
            Проверить ещё раз
          </Button>
        </Box>
      )}
    </VStack>
  );
}
