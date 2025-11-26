import React from "react";
import { SimpleGrid, Skeleton } from "@chakra-ui/react";
import Card from "@ui/molecules/Card";
import SummaryPanel from "@ui/molecules/SummaryPanel";

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
  if (isLoading) return <MetricsStatsSkeleton />;

  const items = [
    { label: "Всего запусков", value: aggregates.count },
    {
      label: "Средняя accuracy",
      value:
        formatPercent(aggregates.avg_accuracy) != null
          ? `${formatPercent(aggregates.avg_accuracy)}%`
          : null,
    },
    { label: "Средний R²", value: formatFixed(aggregates.avg_r2) },
    { label: "Средний MSE", value: formatFixed(aggregates.avg_mse) },
    {
      label: "Лучшая accuracy",
      value:
        formatPercent(aggregates.best_accuracy) != null
          ? `${formatPercent(aggregates.best_accuracy)}%`
          : null,
    },
    { label: "Лучший R²", value: formatFixed(aggregates.best_r2) },
    { label: "Лучший MSE", value: formatFixed(aggregates.best_mse) },
    { label: "Классификации", value: aggregates.classification_count },
    { label: "Регрессии", value: aggregates.regression_count },
  ];

  return <SummaryPanel items={items} columns={{ base: 2, md: 4, lg: 6 }} />;
}

export default MetricsStatsGrid;
