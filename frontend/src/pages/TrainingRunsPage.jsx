import React, { useEffect, useState } from "react";
import { Stack, Table, Thead, Tbody, Tr, Th, Td, Text } from "@chakra-ui/react";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import { listTrainingRuns } from "../API";

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

  useEffect(() => {
    listTrainingRuns({ limit: 50 }).then(setRuns).catch(() => setRuns([]));
  }, []);

  return (
    <Stack spacing={6}>
      <PageHeader title="Запуски обучения" subtitle="История запусков и метрики" />
      <Card p={0} overflowX="auto">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Дата</Th>
              <Th>Метрики</Th>
            </Tr>
          </Thead>
          <Tbody>
            {runs.map((r) => (
              <Tr key={r.id}>
                <Td>{new Date(r.created_at).toLocaleString()}</Td>
                <Td>{renderMetrics(r.metrics)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </Stack>
  );
}

export default TrainingRunsPage;
