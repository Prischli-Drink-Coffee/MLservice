import React, { useEffect, useState, useMemo } from "react";
import { Stack, Table, Thead, Tbody, Tr, Th, Td, Text, Box } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import { listTrainingRuns } from "../API";
import GlowingInput from "../components/common/GlowingInput";
import { EmptyState } from "../components";

function renderMetrics(m) {
  if (!m) return <Text color="text.muted">N/A</Text>;
  if (m.task === "classification") {
    return (
      <Stack spacing={0} fontSize="sm">
        <Text>accuracy: {m.accuracy ?? "N/A"}</Text>
        {m.precision != null && <Text>precision: {m.precision}</Text>}
        {m.recall != null && <Text>recall: {m.recall}</Text>}
        {m.f1 != null && <Text>f1: {m.f1}</Text>}
      </Stack>
    );
  }
  if (m.task === "regression") {
    return (
      <Stack spacing={0} fontSize="sm">
        <Text>r2: {m.r2 ?? "N/A"}</Text>
        <Text>mse: {m.mse ?? "N/A"}</Text>
        {m.mae != null && <Text>mae: {m.mae}</Text>}
      </Stack>
    );
  }
  return <Text color="text.muted">N/A</Text>;
}

function TrainingRunsPage() {
  const [runs, setRuns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    listTrainingRuns({ limit: 50 }).then(setRuns).catch(() => setRuns([]));
  }, []);

  // Фильтруем запуски по поисковому запросу
  const filteredRuns = useMemo(() => {
    if (!searchQuery.trim()) return runs;
    const query = searchQuery.toLowerCase();
    return runs.filter((r) => {
      const dateStr = new Date(r.created_at).toLocaleString().toLowerCase();
      const metricsStr = JSON.stringify(r.metrics).toLowerCase();
      return dateStr.includes(query) || metricsStr.includes(query) || r.id.toString().includes(query);
    });
  }, [runs, searchQuery]);

  return (
    <Stack spacing={6}>
      <PageHeader title="Запуски обучения" subtitle="История запусков и метрики" />

      {/* Поиск запусков */}
      {runs.length > 0 && (
        <Box maxW="600px">
          <GlowingInput
            placeholder="Поиск по дате, метрикам или ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            showSubmitButton={false}
            leftIcon={SearchIcon}
          />
        </Box>
      )}

      {filteredRuns.length === 0 && searchQuery ? (
        <EmptyState title="Ничего не найдено" description={`По запросу "${searchQuery}" запуски не найдены`} />
      ) : (
        <Card p={0} overflowX="auto">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Дата</Th>
                <Th>Метрики</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredRuns.map((r) => (
                <Tr key={r.id}>
                  <Td>{new Date(r.created_at).toLocaleString()}</Td>
                  <Td>{renderMetrics(r.metrics)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}

export default TrainingRunsPage;
