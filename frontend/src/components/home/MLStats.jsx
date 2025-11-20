import React, { useEffect, useRef, useState } from "react";
import { Box, VStack, Spinner, SimpleGrid, usePrefersReducedMotion } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Footnote } from "../common/Typography";
import { colors, spacing, borderRadius, gradients } from "../../theme/tokens";
import { listDatasets } from "../../API/datasets";
import { listTrainingRuns } from "../../API/training";
import { listArtifacts } from "../../API/artifacts";
import { getMetricsSummary } from "../../API/metrics";
import extractErrorInfo from "../../utils/errorHandler";
import isAbortError from "../../utils/isAbortError";

const MotionBox = motion(Box);

/**
 * AnimatedCounter - Animated number counter
 */
function AnimatedCounter({ value, duration = 1.5, decimals = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const targetValue = parseFloat(value) || 0;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = easeOutQuart * targetValue;

      setCount(decimals > 0 ? currentValue : Math.floor(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(targetValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, decimals]);

  return decimals > 0 ? count.toFixed(decimals) : Math.floor(count);
}

/**
 * StatCard - Individual stat card with animation
 */
function StatCard({ label, value, suffix = "", isLoading, color, index, gradient }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const accentColor = color || colors.brand.primary;
  const accentGradient = gradient || gradients.prism;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25 } }}
      h="full"
    >
      <Box
        position="relative"
        overflow="hidden"
        bg="rgba(7,9,18,0.92)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        borderRadius={borderRadius.xl}
        p={{ base: spacing.lg, md: spacing.xl }}
        backdropFilter="blur(24px)"
        transition="all 0.35s ease"
        h="full"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        minH={{ base: "90px", md: "100px" }}
        _hover={{
          borderColor: accentColor,
          boxShadow: `0 20px 55px ${accentColor}2e`,
        }}
        _before={{
          content: '""',
          position: "absolute",
          inset: "-35%",
          background: accentGradient,
          opacity: 0.45,
          filter: "blur(55px)",
          animation: prefersReducedMotion ? "none" : "gradientOrbit 26s linear infinite",
        }}
        _after={{
          content: '""',
          position: "absolute",
          inset: "1px",
          borderRadius: `calc(${borderRadius.xl} - 6px)`,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(125deg, rgba(255,255,255,0.08) 0%, transparent 45%)",
          opacity: 0.65,
          mixBlendMode: "screen",
          animation: prefersReducedMotion ? "none" : "shimmerTrail 7s ease-in-out infinite",
        }}
      >
        <VStack spacing={spacing.sm} align="center" position="relative" zIndex={1}>
          {isLoading ? (
            <Spinner size="md" color={accentColor} thickness="3px" />
          ) : (
            <Footnote
              variant="large"
              color={accentColor}
              fontWeight={700}
              fontSize={{ base: "24px", md: "28px", lg: "32px" }}
              lineHeight="1"
            >
              <AnimatedCounter value={value} decimals={suffix === "%" ? 1 : 0} />
              {suffix}
            </Footnote>
          )}
          <Footnote
            variant="small"
            color={colors.text.tertiary}
            fontSize={{ base: "11px", md: "12px" }}
            textAlign="center"
            paddingLeft={3}
            paddingRight={3}
            noOfLines={2}
            lineHeight="1.3"
          >
            {label}
          </Footnote>
        </VStack>
      </Box>
    </MotionBox>
  );
}

/**
 * MLStats - ML platform statistics component
 */
function MLStats({ isAuthenticated = true }) {
  const [stats, setStats] = useState({
    datasets: 0,
    trainingRuns: 0,
    artifacts: 0,
    avgAccuracy: 0,
    avgR2: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return undefined;
    }

    let mounted = true;

    async function fetchMLStats() {
      if (!mounted) return;
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      try {
        // Fetch data in parallel (requesting more items to get accurate counts)
        const [datasetsRes, runsRes, artifactsRes, metricsRes] = await Promise.allSettled([
          listDatasets({ limit: 100, signal: controller.signal }),
          listTrainingRuns({ limit: 100, signal: controller.signal }),
          listArtifacts({ limit: 100, signal: controller.signal }),
          getMetricsSummary({ limit: 200, signal: controller.signal }),
        ]);

        const newStats = {
          datasets: 0,
          trainingRuns: 0,
          artifacts: 0,
          avgAccuracy: 0,
          avgR2: 0,
        };

        const resolveCount = (result, keys = []) => {
          if (result.status !== "fulfilled") return 0;
          const payload = result.value;
          if (Array.isArray(payload)) return payload.length;
          for (const key of keys) {
            if (Array.isArray(payload?.[key])) return payload[key].length;
            if (typeof payload?.[key] === "number") return payload[key];
          }
          if (typeof payload?.total === "number") return payload.total;
          return 0;
        };

        newStats.datasets = resolveCount(datasetsRes, ["datasets", "items"]);
        newStats.trainingRuns = resolveCount(runsRes, ["training_runs", "runs", "items"]);
        newStats.artifacts = resolveCount(artifactsRes, ["artifacts", "items"]);

        // Extract best metrics from summary
        if (metricsRes.status === "fulfilled" && metricsRes.value) {
          const aggregates = metricsRes.value.aggregates ?? {};
          const accuracyValue = typeof aggregates.avg_accuracy === "number" ? aggregates.avg_accuracy : null;
          const r2Value = typeof aggregates.avg_r2 === "number" ? aggregates.avg_r2 : null;

          if (accuracyValue !== null) {
            newStats.avgAccuracy = Number((accuracyValue * 100).toFixed(1));
          }

          if (r2Value !== null) {
            newStats.avgR2 = Number((r2Value * 100).toFixed(1));
          }
        }

        if (!mounted || controller.signal.aborted) return;
        setStats(newStats);
        setErrorMessage(null);
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }
        const { userMessage } = extractErrorInfo(error, { fallbackMessage: "Не удалось обновить статистику" });
        if (!mounted) return;
        setErrorMessage(userMessage);
      } finally {
        if (!mounted || controller.signal.aborted) return;
        setIsLoading(false);
      }
    }

    const wrappedFetch = async () => {
      if (!mounted) return;
      await fetchMLStats();
    };

    wrappedFetch();

    // Refresh every 60 seconds
    const interval = setInterval(wrappedFetch, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [isAuthenticated]);

  return (
    <VStack spacing={{ base: 4, md: 5 }} w="full" pt={2}>
      {!isAuthenticated && (
        <Footnote variant="small" color={colors.text.secondary} textAlign="center" px={4}>
          Войдите в систему, чтобы увидеть актуальную статистику запусков платформы.
        </Footnote>
      )}
      {errorMessage && (
        <Footnote variant="small" color="red.300" textAlign="center">
          {errorMessage}
        </Footnote>
      )}
      {/* Stats Grid */}
      {isAuthenticated ? (
        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={{ base: 3, md: 4 }} w="full">
          <StatCard
            label="Датасетов"
            value={stats.datasets}
            isLoading={isLoading}
            color={colors.brand.primary}
            gradient={gradients.horizon}
            index={0}
          />
          <StatCard
            label="Запусков обучения"
            value={stats.trainingRuns}
            isLoading={isLoading}
            color={colors.brand.secondary}
            gradient={gradients.prism}
            index={1}
          />
          <StatCard
            label="Артефактов"
            value={stats.artifacts}
            isLoading={isLoading}
            color={colors.brand.tertiary}
            gradient={gradients.midnightMesh}
            index={2}
          />
          <StatCard
            label="Средняя точность"
            value={stats.avgAccuracy}
            suffix="%"
            isLoading={isLoading}
            color="#10b981"
            gradient={gradients.aurora}
            index={3}
          />
          <StatCard
            label="Средний R²"
            value={stats.avgR2}
            suffix="%"
            isLoading={isLoading}
            color="#f59e0b"
            gradient={gradients.dusk}
            index={4}
          />
        </SimpleGrid>
      ) : (
        <Box
          w="full"
          position="relative"
          overflow="hidden"
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          borderRadius={borderRadius.xl}
          p={{ base: spacing.md, md: spacing.lg }}
          textAlign="center"
          bg="rgba(7,9,18,0.85)"
          backdropFilter="blur(18px)"
          boxShadow="0 25px 60px rgba(0,0,0,0.35)"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-30%",
            background: gradients.midnightMesh,
            opacity: 0.45,
            filter: "blur(60px)",
          }}
          _after={{
            content: '""',
            position: "absolute",
            inset: "1px",
            borderRadius: `calc(${borderRadius.xl} - 6px)`,
            background: "linear-gradient(120deg, rgba(255,255,255,0.08), transparent 42%)",
            opacity: 0.5,
          }}
        >
          <Footnote variant="small" color={colors.text.secondary} position="relative" zIndex={1}>
            Подключите аккаунт, чтобы отслеживать метрики и историю запусков прямо на главной странице.
          </Footnote>
        </Box>
      )}
    </VStack>
  );
}

export default MLStats;
