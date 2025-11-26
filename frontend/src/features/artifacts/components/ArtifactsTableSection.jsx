import PropTypes from "prop-types";
import { IconButton, Stack, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { FiDownload, FiTrash2 } from "react-icons/fi";
import GlowingCard from "@ui/molecules/GlowingCard";
import Card from "@ui/molecules/Card";
import EmptyState from "@ui/molecules/EmptyState";
import ErrorAlert from "@ui/molecules/ErrorAlert";
import LoadingState from "@ui/molecules/LoadingState";

function renderMetrics(metrics) {
  if (!metrics) {
    return <Text color="text.muted">N/A</Text>;
  }

  const rows = [
    metrics.task && `task: ${metrics.task}`,
    metrics.accuracy != null && `accuracy: ${metrics.accuracy}`,
    metrics.r2 != null && `r2: ${metrics.r2}`,
    metrics.mse != null && `mse: ${metrics.mse}`,
    metrics.mae != null && `mae: ${metrics.mae}`,
  ].filter(Boolean);

  if (!rows.length) {
    return <Text color="text.muted">N/A</Text>;
  }

  return (
    <Stack spacing={0} fontSize="xs">
      {rows.map((row) => (
        <Text key={row}>{row}</Text>
      ))}
    </Stack>
  );
}

function ArtifactsTableSection({
  isInitialLoading,
  loading,
  error,
  onDismissError,
  artifacts,
  filteredArtifacts,
  searchQuery,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
}) {
  if (isInitialLoading) {
    return (
      <GlowingCard intensity="subtle">
        <LoadingState label="Загружаем артефакты" />
      </GlowingCard>
    );
  }

  if (error) {
    return (
      <GlowingCard intensity="subtle">
        <ErrorAlert description={error} onClose={onDismissError} />
      </GlowingCard>
    );
  }

  if (!artifacts.length) {
    return (
      <GlowingCard intensity="subtle">
        <EmptyState
          title="Артефактов пока нет"
          description="Загрузите модели, чтобы увидеть историю артефактов"
        />
      </GlowingCard>
    );
  }

  if (!filteredArtifacts.length) {
    return (
      <GlowingCard intensity="subtle">
        <EmptyState
          title="Ничего не найдено"
          description={`По запросу "${searchQuery}" артефакты не найдены`}
        />
      </GlowingCard>
    );
  }

  return (
    <Card p={0} overflowX="auto" padding={2}>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Дата</Th>
            <Th>URL</Th>
            <Th>Метрики</Th>
            <Th textAlign="right">Действия</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredArtifacts.map((artifact) => (
            <Tr key={artifact.id}>
              <Td>{new Date(artifact.created_at).toLocaleString()}</Td>
              <Td maxW="320px" wordBreak="break-all">
                {artifact.model_url}
              </Td>
              <Td>{renderMetrics(artifact.metrics)}</Td>
              <Td>
                <Stack direction="row" justify="flex-end" spacing={2}>
                  <IconButton
                    size="sm"
                    aria-label="Скачать"
                    icon={<FiDownload />}
                    variant="outline"
                    onClick={() => onDownload(artifact)}
                    isLoading={downloadingId === artifact.id}
                    isDisabled={loading}
                  />
                  <IconButton
                    size="sm"
                    aria-label="Удалить"
                    icon={<FiTrash2 />}
                    colorScheme="red"
                    variant="outline"
                    onClick={() => onDelete(artifact)}
                    isDisabled={loading || deletingId === artifact.id}
                    isLoading={deletingId === artifact.id}
                  />
                </Stack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}

ArtifactsTableSection.propTypes = {
  isInitialLoading: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onDismissError: PropTypes.func,
  artifacts: PropTypes.arrayOf(PropTypes.object),
  filteredArtifacts: PropTypes.arrayOf(PropTypes.object),
  searchQuery: PropTypes.string,
  onDownload: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  downloadingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  deletingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ArtifactsTableSection.defaultProps = {
  isInitialLoading: false,
  loading: false,
  error: null,
  onDismissError: undefined,
  artifacts: [],
  filteredArtifacts: [],
  searchQuery: "",
  downloadingId: null,
  deletingId: null,
};

export default ArtifactsTableSection;
