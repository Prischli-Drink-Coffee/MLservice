import React from "react";
import { Stack, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import Card from "../../../components/common/Card";

function MetricTexts({ metrics }) {
  if (!metrics) {
    return <Text color="text.muted">N/A</Text>;
  }

  const entries = [
    metrics.accuracy != null ? `accuracy: ${(metrics.accuracy * 100).toFixed(1)}%` : null,
    metrics.r2 != null ? `r2: ${metrics.r2.toFixed(3)}` : null,
    metrics.mse != null ? `mse: ${metrics.mse.toFixed(3)}` : null,
    metrics.mae != null ? `mae: ${metrics.mae.toFixed(3)}` : null,
  ].filter(Boolean);

  if (!entries.length) {
    return <Text color="text.muted">N/A</Text>;
  }

  return (
    <Stack spacing={1} fontSize="sm">
      {entries.map((entry) => (
        <Text key={entry}>{entry}</Text>
      ))}
    </Stack>
  );
}

function MetricsRunsTable({ trends }) {
  if (!trends?.length) {
    return null;
  }

  return (
    <Card p={0} overflowX="auto" padding={2}>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Дата</Th>
            <Th>Версия</Th>
            <Th>Тип</Th>
            <Th>Метрики</Th>
          </Tr>
        </Thead>
        <Tbody>
          {trends.map((t) => (
            <Tr key={t.run_id}>
              <Td>{new Date(t.created_at).toLocaleString()}</Td>
              <Td>{t.version ? `v${t.version}` : "—"}</Td>
              <Td>{t.metrics?.task || "—"}</Td>
              <Td>
                <MetricTexts metrics={t.metrics} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}

export default MetricsRunsTable;
