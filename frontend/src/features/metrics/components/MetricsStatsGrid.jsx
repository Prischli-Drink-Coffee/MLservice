import React from "react";
import { SimpleGrid, Skeleton, Spinner, Stack, Text } from "@chakra-ui/react";
import Card from "@ui/molecules/Card";

function StatCard({ label, value, suffix = "", isLoading }) {
  const displayValue = value ?? "—";
  return (
    <Card p={4} h="100%">
      <Stack spacing={1} h="full" justify="space-between">
        <Text fontSize="sm" color="text.muted">
          {label}
        </Text>
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <Text fontWeight="semibold">
            {displayValue}
            {displayValue !== "—" ? suffix : ""}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

export function MetricsStatsSkeleton() {
  return (
    <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={`stat-skeleton-${idx}`} p={4}>
          <Skeleton height="12px" mb={3} />
          <Skeleton height="20px" />
        </Card>
      ))}
    </SimpleGrid>
  );
}

function formatPercent(value) {
  if (value == null) return null;
  return (value * 100).toFixed(1);
}

function formatFixed(value, digits = 3) {
  if (value == null) return null;
  return value.toFixed(digits);
}

function MetricsStatsGrid({ aggregates, isLoading }) {
  return (
    <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
      <StatCard label="Всего запусков" value={aggregates.count} isLoading={isLoading} />
      <StatCard
        label="Средняя accuracy"
        value={formatPercent(aggregates.avg_accuracy)}
        suffix="%"
        isLoading={isLoading}
      />
      <StatCard label="Средний R²" value={formatFixed(aggregates.avg_r2)} isLoading={isLoading} />
      <StatCard label="Средний MSE" value={formatFixed(aggregates.avg_mse)} isLoading={isLoading} />
      <StatCard
        label="Лучшая accuracy"
        value={formatPercent(aggregates.best_accuracy)}
        suffix="%"
        isLoading={isLoading}
      />
      <StatCard label="Лучший R²" value={formatFixed(aggregates.best_r2)} isLoading={isLoading} />
      <StatCard label="Лучший MSE" value={formatFixed(aggregates.best_mse)} isLoading={isLoading} />
      <StatCard label="Классификации" value={aggregates.classification_count} isLoading={isLoading} />
      <StatCard label="Регрессии" value={aggregates.regression_count} isLoading={isLoading} />
    </SimpleGrid>
  );
}

export default MetricsStatsGrid;
