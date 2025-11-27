import React from "react";
import { Stack } from "@chakra-ui/react";
import PageHeader from "@ui/molecules/PageHeader";
import useMetricsPageController from "@features/metrics/useMetricsPageController";
import MetricsFiltersCard from "@features/metrics/components/MetricsFiltersCard";
import MetricsNoticeCard from "@features/metrics/components/MetricsNoticeCard";
import MetricsStatsGrid, {
  MetricsStatsSkeleton,
} from "@features/metrics/components/MetricsStatsGrid";
import MetricsTrendsSection from "@features/metrics/components/MetricsTrendsSection";
import MetricsRunsTable from "@features/metrics/components/MetricsRunsTable";

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
    <Stack spacing={6} bg="transparent">
      <PageHeader
        eyebrow="OBSERVABILITY"
        title="Метрики"
        subtitle="Подключайте датасеты, выбирайте целевой столбец и отслеживайте качество моделей."
        description="Данные агрегируются в реальном времени и сохраняют историю экспериментов для аудита."
        metrics={[
          { label: "Датасеты", value: datasets.length || "—" },
          {
            label: "Срезы",
            value: metricsData ? (trends?.length ?? 0) : 0,
            caption: "обновляется при выборе target",
          },
          { label: "Статус загрузки", value: metricsLoading ? "загружаем" : "готово" },
        ]}
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
          В выбранном датасете не распознаны заголовки. Убедитесь, что CSV содержит строку с
          названиями колонок.
        </MetricsNoticeCard>
      )}

      {isInitialLoading && <MetricsNoticeCard isSkeleton />}

      {!isInitialLoading && !metricsData && !metricsError && !cannotSelectTarget && (
        <MetricsNoticeCard>
          Нет запусков для выбранного датасета и целевого столбца.
        </MetricsNoticeCard>
      )}

      {metricsLoading && !metricsData && <MetricsStatsSkeleton />}

      {metricsData && (
        <>
          <MetricsStatsGrid aggregates={aggregates} isLoading={metricsLoading} />

          <MetricsTrendsSection
            clsPoints={clsPoints}
            regPoints={regPoints}
            isLoading={metricsLoading}
          />

          <MetricsRunsTable trends={trends} />
        </>
      )}
    </Stack>
  );
}

export default MetricsPage;
