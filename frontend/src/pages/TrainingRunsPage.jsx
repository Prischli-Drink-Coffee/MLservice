import React from "react";
import { Stack } from "@chakra-ui/react";
import PageHeader from "../components/common/PageHeader";
import TrainingRunLauncher from "../features/trainingRuns/components/TrainingRunLauncher";
import TrainingRunsHistory from "../features/trainingRuns/components/TrainingRunsHistory";
import useTrainingRunsController from "../features/trainingRuns/useTrainingRunsController";

function TrainingRunsPage() {
  const {
    runs,
    runsLoading,
    runsError,
    filteredRuns,
    searchQuery,
    setSearchQuery,
    dismissRunsError,
    datasets,
    datasetsLoading,
    datasetsError,
    dismissDatasetsError,
    selectedDatasetId,
    setSelectedDatasetId,
    selectedDataset,
    targetColumn,
    setTargetColumn,
    refreshDatasets,
    jobInfo,
    jobError,
    dismissJobError,
    launchingPreset,
    isPolling,
    handleStartJob,
    handleRefreshStatus,
  } = useTrainingRunsController();

  return (
    <Stack spacing={6}>
      <PageHeader title="Запуски обучения" subtitle="История запусков, запуск новых обучений" />

      <TrainingRunLauncher
        datasets={datasets}
        datasetsLoading={datasetsLoading}
        datasetsError={datasetsError}
        onDismissDatasetsError={dismissDatasetsError}
        selectedDatasetId={selectedDatasetId}
        onSelectDataset={setSelectedDatasetId}
        selectedDataset={selectedDataset}
        targetColumn={targetColumn}
        onSelectTargetColumn={setTargetColumn}
        onRefreshDatasets={refreshDatasets}
        onStartJob={handleStartJob}
        launchingPreset={launchingPreset}
        jobError={jobError}
        onDismissJobError={dismissJobError}
        jobInfo={jobInfo}
        onRefreshStatus={handleRefreshStatus}
        isPolling={isPolling}
      />

      <TrainingRunsHistory
        runs={runs}
        filteredRuns={filteredRuns}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery("")}
        runsLoading={runsLoading}
        runsError={runsError}
        onDismissRunsError={dismissRunsError}
      />
    </Stack>
  );
}

export default TrainingRunsPage;
