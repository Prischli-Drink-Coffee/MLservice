import React, { useEffect, useState } from "react";
import { Box, VStack, Spinner, SimpleGrid } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Footnote } from "../common/Typography";
import { colors, spacing, borderRadius } from "../../theme/tokens";
import { listDatasets } from "../../API/datasets";
import { listTrainingRuns } from "../../API/training";
import { listArtifacts } from "../../API/artifacts";
import { getMetricsSummary } from "../../API/metrics";

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
function StatCard({ label, value, suffix = "", isLoading, color, index }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      h="full"
    >
      <Box
        bg={colors.blur.medium}
        border="1px solid"
        borderColor={colors.border.default}
        borderRadius={borderRadius.xl}
        p={{ base: spacing[4], md: spacing[5] }}
        backdropFilter="blur(20px)"
        transition="all 0.3s ease"
        h="full"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        minH={{ base: "90px", md: "100px" }}
        _hover={{
          borderColor: color || colors.brand.primary,
          boxShadow: `0 0 25px ${color || colors.brand.primary}30`,
        }}
      >
        <VStack spacing={spacing[2]} align="center">
          {isLoading ? (
            <Spinner size="md" color={color || colors.brand.primary} thickness="3px" />
          ) : (
            <Footnote
              variant="large"
              color={color || colors.brand.primary}
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
function MLStats() {
  const [stats, setStats] = useState({
    datasets: 0,
    trainingRuns: 0,
    artifacts: 0,
    bestAccuracy: 0,
    bestR2: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMLStats() {
      setIsLoading(true);
      try {
        // Fetch data in parallel (requesting more items to get accurate counts)
        const [datasetsRes, runsRes, artifactsRes, metricsRes] = await Promise.allSettled([
          listDatasets({ limit: 1000 }),
          listTrainingRuns({ limit: 1000 }),
          listArtifacts({ limit: 1000 }),
          getMetricsSummary({ limit: 1000 }),
        ]);

        const newStats = {
          datasets: 0,
          trainingRuns: 0,
          artifacts: 0,
          bestAccuracy: 0,
          bestR2: 0,
        };

        // Extract counts from responses
        if (datasetsRes.status === "fulfilled" && datasetsRes.value?.datasets) {
          newStats.datasets = datasetsRes.value.datasets.length || 0;
        }

        if (runsRes.status === "fulfilled" && runsRes.value?.training_runs) {
          newStats.trainingRuns = runsRes.value.training_runs.length || 0;
        }

        if (artifactsRes.status === "fulfilled" && artifactsRes.value?.artifacts) {
          newStats.artifacts = artifactsRes.value.artifacts.length || 0;
        }

        // Extract best metrics from summary
        if (metricsRes.status === "fulfilled" && metricsRes.value) {
          const summary = metricsRes.value;
          
          if (summary.aggregates) {
            // Best accuracy (classification)
            if (summary.aggregates.best_accuracy !== null && summary.aggregates.best_accuracy !== undefined) {
              newStats.bestAccuracy = (summary.aggregates.best_accuracy * 100) || 0;
            }
            
            // Best R2 (regression)
            if (summary.aggregates.best_r2 !== null && summary.aggregates.best_r2 !== undefined) {
              newStats.bestR2 = (summary.aggregates.best_r2 * 100) || 0;
            }
          }
        }

        setStats(newStats);
      } catch (error) {
        console.error("Failed to fetch ML stats:", error);
        // Keep default zeros on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchMLStats();

    // Refresh every 60 seconds
    const interval = setInterval(fetchMLStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <VStack spacing={{ base: 4, md: 5 }} w="full" pt={2}>
      {/* Stats Grid */}
      <SimpleGrid
        columns={{ base: 2, md: 3, lg: 5 }}
        spacing={{ base: 3, md: 4 }}
        w="full"
      >
        <StatCard
          label="Датасетов"
          value={stats.datasets}
          isLoading={isLoading}
          color={colors.brand.primary}
          index={0}
        />
        <StatCard
          label="Запусков обучения"
          value={stats.trainingRuns}
          isLoading={isLoading}
          color={colors.brand.secondary}
          index={1}
        />
        <StatCard
          label="Артефактов"
          value={stats.artifacts}
          isLoading={isLoading}
          color={colors.brand.tertiary}
          index={2}
        />
        <StatCard
          label="Лучшая точность"
          value={stats.bestAccuracy}
          suffix="%"
          isLoading={isLoading}
          color="#10b981"
          index={3}
        />
        <StatCard
          label="Лучший R²"
          value={stats.bestR2}
          suffix="%"
          isLoading={isLoading}
          color="#f59e0b"
          index={4}
        />
      </SimpleGrid>
    </VStack>
  );
}

export default MLStats;
