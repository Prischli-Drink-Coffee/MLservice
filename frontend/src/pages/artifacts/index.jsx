import { Stack } from "@chakra-ui/react";
import PageHeader from "@ui/molecules/PageHeader";
import DatasetSearchBar from "@features/datasets/components/DatasetSearchBar";
import useArtifactsPageController from "@features/artifacts/useArtifactsPageController";
import ArtifactsTableSection from "@features/artifacts/components/ArtifactsTableSection";
import ConfirmationDialog from "@ui/molecules/ConfirmationDialog";

function ArtifactsPage() {
  const {
    artifacts,
    filteredArtifacts,
    searchQuery,
    setSearchQuery,
    loading,
    isInitialLoading,
    downloadingId,
    deletingId,
    error,
    setError,
    requestDelete,
    confirmDelete,
    cancelDelete,
    artifactToDelete,
    handleDownload,
  } = useArtifactsPageController();

  return (
    <Stack spacing={6} bg="transparent" w="full">
      <PageHeader
        eyebrow="REGISTRY"
        title="Артефакты моделей"
        subtitle="Вёрсионированное хранилище чекпоинтов, графов и вспомогательных файлов."
        metrics={[
          { label: "Объектов", value: artifacts.length },
          { label: "После фильтра", value: filteredArtifacts.length },
          {
            label: "Активные операции",
            value: deletingId || downloadingId ? "1" : "0",
            caption: deletingId ? "удаление" : downloadingId ? "скачивание" : "нет",
          },
        ]}
      />

      <DatasetSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery("")}
        totalCount={artifacts.length}
        filteredCount={filteredArtifacts.length}
        variant="artifacts"
      />

      <ArtifactsTableSection
        isInitialLoading={isInitialLoading}
        loading={loading}
        error={error}
        onDismissError={() => setError(null)}
        artifacts={artifacts}
        filteredArtifacts={filteredArtifacts}
        searchQuery={searchQuery}
        onDownload={handleDownload}
        onDelete={requestDelete}
        downloadingId={downloadingId}
        deletingId={deletingId}
      />

      <ConfirmationDialog
        isOpen={!!artifactToDelete}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Удаление артефакта"
        description={
          artifactToDelete
            ? `Вы уверены, что хотите удалить артефакт #${artifactToDelete.id}? Это действие необратимо.`
            : ""
        }
        confirmText="Удалить"
        isLoading={!!deletingId}
      />
    </Stack>
  );
}

export default ArtifactsPage;
