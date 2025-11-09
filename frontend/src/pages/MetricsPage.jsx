import React, { useEffect, useMemo, useState } from "react";
import { Stack, SimpleGrid, Text, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue } from "@chakra-ui/react";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import { getMetricsSummary } from "../API";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

function Stat({ label, value }) {
  return (
    <Card p={4}>
      <Stack spacing={1}>
        <Text fontSize="sm" color="text.muted">{label}</Text>
        <Text fontWeight="semibold">{value ?? "N/A"}</Text>
      </Stack>
    </Card>
  );
}

function MetricsPage() {
  const [data, setData] = useState(null);
  const gridColor = useColorModeValue("#EDF2F7", "#2D3748");

  useEffect(() => {
    getMetricsSummary({ limit: 50 }).then(setData).catch(() => setData(null));
  }, []);

  const agg = data?.aggregates;

  const { clsPoints, regPoints } = useMemo(() => {
    const trends = data?.trends || [];
    const cls = [];
    const reg = [];
    trends.forEach((t) => {
      const ts = new Date(t.created_at).toLocaleString();
      if (t.metrics?.task === "classification") {
        cls.push({ ts, version: t.version, accuracy: t.metrics.accuracy ?? null });
      } else if (t.metrics?.task === "regression") {
        reg.push({ ts, version: t.version, r2: t.metrics.r2 ?? null, mse: t.metrics.mse ?? null });
      }
    });
    return { clsPoints: cls, regPoints: reg };
  }, [data]);

  return (
    <Stack spacing={6}>
      <PageHeader title="Метрики" subtitle="Сводная статистика и тренды качества моделей" />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Stat label="Всего запусков" value={agg?.count} />
        <Stat label="avg accuracy" value={agg?.avg_accuracy} />
        <Stat label="avg r2" value={agg?.avg_r2} />
        <Stat label="avg mse" value={agg?.avg_mse} />
        <Stat label="best accuracy" value={agg?.best_accuracy} />
        <Stat label="best r2" value={agg?.best_r2} />
        <Stat label="best mse" value={agg?.best_mse} />
        <Stat label="classification" value={agg?.classification_count} />
        <Stat label="regression" value={agg?.regression_count} />
      </SimpleGrid>

      {/* График: accuracy по времени */}
      <Card p={4}>
        <Text fontWeight="semibold" mb={2}>Тренд точности (accuracy)</Text>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={clsPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="ts" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="accuracy" name="accuracy" stroke="#805AD5" strokeWidth={2} dot={false} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* График: r2 по времени */}
      <Card p={4}>
        <Text fontWeight="semibold" mb={2}>Тренд R2</Text>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={regPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="ts" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="r2" name="r2" stroke="#38A169" strokeWidth={2} dot={false} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Таблица трендов для подробностей */}
      <Card p={0} overflowX="auto">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Дата</Th>
              <Th>Версия датасета</Th>
              <Th>Метрики</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data?.trends?.map((t) => (
              <Tr key={t.run_id}>
                <Td>{new Date(t.created_at).toLocaleString()}</Td>
                <Td>v{t.version}</Td>
                <Td>
                  {t.metrics ? (
                    <Stack spacing={0} fontSize="sm">
                      <Text>task: {t.metrics.task}</Text>
                      {t.metrics.accuracy != null && <Text>accuracy: {t.metrics.accuracy}</Text>}
                      {t.metrics.r2 != null && <Text>r2: {t.metrics.r2}</Text>}
                      {t.metrics.mse != null && <Text>mse: {t.metrics.mse}</Text>}
                      {t.metrics.mae != null && <Text>mae: {t.metrics.mae}</Text>}
                    </Stack>
                  ) : (
                    <Text color="text.muted">N/A</Text>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </Stack>
  );
}

export default MetricsPage;
