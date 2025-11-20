import React from "react";
import {
  Card,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Stack,
  Box,
} from "@chakra-ui/react";
import DatasetSearchBar from "../../../components/datasets/DatasetSearchBar";
import { EmptyState, ErrorAlert, LoadingState } from "../../../components";
import RunMetrics from "./RunMetrics";
import { formatDateTime } from "../utils";

export default function TrainingRunsHistory({
  runs,
  filteredRuns,
  searchQuery,
  onSearchChange,
  onSearchClear,
  runsLoading,
  runsError,
  onDismissRunsError,
}) {
  const renderContent = () => {
    if (runsError) {
      return <ErrorAlert description={runsError} onClose={onDismissRunsError} />;
    }

    if (runsLoading && runs.length === 0) {
      return (
        <Card>
          <LoadingState label="Загружаем историю запусков" />
        </Card>
      );
    }

    if (filteredRuns.length === 0 && searchQuery) {
      return (
        <EmptyState title="Ничего не найдено" description={`По запросу "${searchQuery}" запуски не найдены`} />
      );
    }

    if (runs.length === 0) {
      return <EmptyState title="Запуски отсутствуют" description="Запустите обучение, чтобы увидеть статистику" />;
    }

    return (
      <Card p={0} overflowX="auto" padding={2}>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Дата</Th>
              <Th>Метрики</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredRuns.map((run) => (
              <Tr key={run.id}>
                <Td>{formatDateTime(run.created_at)}</Td>
                <Td><RunMetrics metrics={run.metrics} /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    );
  };

  return (
    <Stack spacing={4}>
      <Box maxW="900px">
        <DatasetSearchBar
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onSearchClear}
          totalCount={runs.length}
          filteredCount={filteredRuns.length}
          variant="runs"
        />
      </Box>
      {renderContent()}
    </Stack>
  );
}
