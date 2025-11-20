import { Stack } from "@chakra-ui/react";
import PageHeader from "../components/common/PageHeader";
import DatasetSearchBar from "../components/datasets/DatasetSearchBar";
import useArtifactsPageController from "../features/artifacts/useArtifactsPageController";
import ArtifactsTableSection from "../features/artifacts/components/ArtifactsTableSection";
import ConfirmationDialog from "../components/common/ConfirmationDialog";

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
    <Stack spacing={6}>
      <PageHeader title="Артефакты моделей" subtitle="Хранение экспортированных моделей" actions={null} />

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
