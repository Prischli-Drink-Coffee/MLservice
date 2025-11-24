import { Stack } from "@chakra-ui/react";
import PageHeader from "@ui/molecules/PageHeader";
import DatasetSearchBar from "@features/datasets/components/DatasetSearchBar";
import TTLCleanupCard from "@ui/organisms/TTLCleanupCard";
import useDatasetsPageController from "@features/datasets/useDatasetsPageController";
import DatasetUploadControls from "@features/datasets/components/DatasetUploadControls";
import DatasetGuidelinesCard from "@features/datasets/components/DatasetGuidelinesCard";
import DatasetsGridSection from "@features/datasets/components/DatasetsGridSection";
import ConfirmationDialog from "@ui/molecules/ConfirmationDialog";

function DatasetsPage() {
  const {
    datasets,
    filteredDatasets,
    loadDatasets,
    file,
    setFile,
    searchQuery,
    setSearchQuery,
    isUploading,
    isLoading,
    isInitialLoading,
    downloadingId,
    deletingId,
    error,
    setError,
    handleUpload,
    handleDownload,
    requestDelete,
    confirmDelete,
    cancelDelete,
    datasetToDelete,
    csvGuidelines,
    canCleanupDatasets,
  } = useDatasetsPageController();

  return (
    <Stack spacing={{ base: 6, md: 8 }} w="full">
      <PageHeader
        title="Датасеты"
        subtitle="Загружайте CSV файлы для обучения моделей"
        actions={
          <DatasetUploadControls
            file={file}
            onFileSelect={setFile}
            onUpload={handleUpload}
            onRefresh={loadDatasets}
            isUploading={isUploading}
            isLoading={isLoading}
          />
        }
      />

      {canCleanupDatasets && <TTLCleanupCard canCleanup />}

      <DatasetSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery("")}
        totalCount={datasets.length}
        filteredCount={filteredDatasets.length}
        placeholder="Поиск по названию, версии или ID..."
      />

      <DatasetGuidelinesCard guidelines={csvGuidelines} />

      <DatasetsGridSection
        isInitialLoading={isInitialLoading}
        error={error}
        onDismissError={() => setError(null)}
        datasets={datasets}
        filteredDatasets={filteredDatasets}
        searchQuery={searchQuery}
        onDownload={handleDownload}
        onDelete={requestDelete}
        downloadingId={downloadingId}
        deletingId={deletingId}
      />

      <ConfirmationDialog
        isOpen={!!datasetToDelete}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Удаление датасета"
        description={
          datasetToDelete
            ? `Вы уверены, что хотите удалить датасет "${datasetToDelete.name}"? Это действие необратимо.`
            : ""
        }
        confirmText="Удалить"
        isLoading={!!deletingId}
      />
    </Stack>
  );
}

export default DatasetsPage;
