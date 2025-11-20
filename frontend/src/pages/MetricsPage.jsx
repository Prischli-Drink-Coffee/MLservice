import React from "react";
import { Stack } from "@chakra-ui/react";
import PageHeader from "../components/common/PageHeader";
import useMetricsPageController from "../features/metrics/useMetricsPageController";
import MetricsFiltersCard from "../features/metrics/components/MetricsFiltersCard";
import MetricsNoticeCard from "../features/metrics/components/MetricsNoticeCard";
import MetricsStatsGrid, { MetricsStatsSkeleton } from "../features/metrics/components/MetricsStatsGrid";
import MetricsTrendsSection from "../features/metrics/components/MetricsTrendsSection";
import MetricsRunsTable from "../features/metrics/components/MetricsRunsTable";

function MetricsPage() {
  const {
    datasets,
    datasetsLoading,
    datasetsError,
    selectedDataset,
    selectedDatasetId,
    setSelectedDatasetId,
    targetColumn,
    setTargetColumn,
    targetOptions,
    loadMetrics,
    metricsData,
    metricsLoading,
    metricsError,
    aggregates,
    clsPoints,
    regPoints,
    trends,
    cannotSelectTarget,
    isInitialLoading,
  } = useMetricsPageController();

  return (
    <Stack spacing={6}>
      <PageHeader
        title="Метрики"
        subtitle="Выберите датасет и целевой столбец, чтобы посмотреть тренды качества"
      />

      <MetricsFiltersCard
        datasets={datasets}
        datasetsLoading={datasetsLoading}
        datasetsError={datasetsError}
        selectedDatasetId={selectedDatasetId}
        onDatasetChange={setSelectedDatasetId}
        selectedDataset={selectedDataset}
        targetColumn={targetColumn}
        onTargetChange={setTargetColumn}
        targetOptions={targetOptions}
        metricsLoading={metricsLoading}
        onRefresh={loadMetrics}
        metricsError={metricsError}
      />

      {cannotSelectTarget && (
        <MetricsNoticeCard>
          В выбранном датасете не распознаны заголовки. Убедитесь, что CSV содержит строку с названиями колонок.
        </MetricsNoticeCard>
      )}

  {isInitialLoading && <MetricsNoticeCard isSkeleton />}

      {!isInitialLoading && !metricsData && !metricsError && !cannotSelectTarget && (
        <MetricsNoticeCard>Нет запусков для выбранного датасета и целевого столбца.</MetricsNoticeCard>
      )}

      {metricsLoading && !metricsData && <MetricsStatsSkeleton />}

      {metricsData && (
        <>
          <MetricsStatsGrid aggregates={aggregates} isLoading={metricsLoading} />

          <MetricsTrendsSection clsPoints={clsPoints} regPoints={regPoints} isLoading={metricsLoading} />

          <MetricsRunsTable trends={trends} />
        </>
      )}
    </Stack>
  );
}

export default MetricsPage;
