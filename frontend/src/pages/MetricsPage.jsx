import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import { getMetricsSummary, listDatasets } from "../API";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

function Stat({ label, value, isLoading }) {
  return (
    <Card p={4} h="100%">
      <Stack spacing={1} h="full" justify="space-between">
        <Text fontSize="sm" color="text.muted">
          {label}
        </Text>
        {isLoading ? <Spinner size="sm" /> : <Text fontWeight="semibold">{value ?? "N/A"}</Text>}
      </Stack>
    </Card>
  );
}

function MetricsPage() {
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [datasetsError, setDatasetsError] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadDatasets = async () => {
      setDatasetsLoading(true);
      setDatasetsError(null);
      try {
        const result = await listDatasets({ limit: 50 });
        if (cancelled) return;
        setDatasets(result);
        setSelectedDatasetId((prev) => prev || result[0]?.id || "");
      } catch (error) {
        if (cancelled) return;
        const message = error.response?.data?.detail || error.message || "Не удалось загрузить датасеты";
        setDatasetsError(message);
      } finally {
        if (!cancelled) {
          setDatasetsLoading(false);
        }
      }
    };
    loadDatasets();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) || null,
    [datasets, selectedDatasetId],
  );

  const targetOptions = useMemo(() => {
    const cols = selectedDataset?.columns;
    return Array.isArray(cols) ? cols : [];
  }, [selectedDataset]);

  useEffect(() => {
    const cols = targetOptions;
    if (!cols.length) {
      setTargetColumn("");
      return;
    }
    setTargetColumn((prev) => (prev && cols.includes(prev) ? prev : cols[cols.length - 1] || cols[0]));
  }, [targetOptions]);

  const loadMetrics = useCallback(async () => {
    if (!selectedDatasetId || !targetColumn) {
      setData(null);
      return;
    }
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const response = await getMetricsSummary({
        limit: 50,
        datasetId: selectedDatasetId,
        targetColumn,
      });
      setData(response);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Не удалось загрузить метрики";
      setMetricsError(message);
      setData(null);
    } finally {
      setMetricsLoading(false);
    }
  }, [selectedDatasetId, targetColumn]);

  useEffect(() => {
    if (!selectedDatasetId || !targetColumn) return;
    loadMetrics();
  }, [selectedDatasetId, targetColumn, loadMetrics]);

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

  const isInitialLoading = metricsLoading && !data;
  const cannotSelectTarget = Boolean(selectedDataset) && !targetOptions.length && !datasetsLoading;

  return (
    <Stack spacing={6}>
      <PageHeader
        title="Метрики"
        subtitle="Выберите датасет и целевой столбец, чтобы посмотреть тренды качества"
      />

      <Card p={4}>
        <Stack spacing={4}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Box>
              <Text fontSize="xs" textTransform="uppercase" color="text.tertiary" mb={2}>
                Датасет
              </Text>
              <Select
                placeholder={datasetsLoading ? "Загружаем датасеты..." : "Выберите датасет"}
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                isDisabled={datasetsLoading || datasets.length === 0}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name || dataset.id}
                  </option>
                ))}
              </Select>
            </Box>
            <Box>
              <Text fontSize="xs" textTransform="uppercase" color="text.tertiary" mb={2}>
                Целевой столбец
              </Text>
              <Select
                placeholder="Нет доступных колонок"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                isDisabled={datasetsLoading || !targetOptions.length}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
              >
                {targetOptions.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </Select>
            </Box>
            <Box display="flex" alignItems="flex-end">
              <Button
                onClick={loadMetrics}
                colorScheme="brand"
                w="full"
                isDisabled={!selectedDatasetId || !targetColumn}
                isLoading={metricsLoading}
              >
                Обновить метрики
              </Button>
            </Box>
          </SimpleGrid>
          {selectedDataset && (
            <HStack spacing={4} fontSize="sm" color="text.muted" flexWrap="wrap">
              <Text>Версия: {selectedDataset.version ? `v${selectedDataset.version}` : "—"}</Text>
              <Text>ID: {selectedDataset.id}</Text>
            </HStack>
          )}
          {datasetsError && (
            <Alert status="error">
              <AlertIcon />
              {datasetsError}
            </Alert>
          )}
          {metricsError && (
            <Alert status="error">
              <AlertIcon />
              {metricsError}
            </Alert>
          )}
        </Stack>
      </Card>

      {cannotSelectTarget && (
        <Card p={4}>
          <Text color="text.muted">
            В выбранном датасете не распознаны заголовки. Убедитесь, что CSV содержит строку с названиями колонок.
          </Text>
        </Card>
      )}

      {isInitialLoading && (
        <Card p={4}>
          <HStack spacing={3} align="center">
            <Spinner size="sm" />
            <Text color="text.muted">Загружаем метрики...</Text>
          </HStack>
        </Card>
      )}

      {!isInitialLoading && !data && !metricsError && !cannotSelectTarget && (
        <Card p={4}>
          <Text color="text.muted">Нет запусков для выбранного датасета и целевого столбца.</Text>
        </Card>
      )}

      {data && (
        <>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat label="Всего запусков" value={agg?.count} isLoading={metricsLoading && !data} />
            <Stat label="avg accuracy" value={agg?.avg_accuracy} isLoading={metricsLoading && !data} />
            <Stat label="avg r2" value={agg?.avg_r2} isLoading={metricsLoading && !data} />
            <Stat label="avg mse" value={agg?.avg_mse} isLoading={metricsLoading && !data} />
            <Stat label="best accuracy" value={agg?.best_accuracy} isLoading={metricsLoading && !data} />
            <Stat label="best r2" value={agg?.best_r2} isLoading={metricsLoading && !data} />
            <Stat label="best mse" value={agg?.best_mse} isLoading={metricsLoading && !data} />
            <Stat label="classification" value={agg?.classification_count} isLoading={metricsLoading && !data} />
            <Stat label="regression" value={agg?.regression_count} isLoading={metricsLoading && !data} />
          </SimpleGrid>

          <Card p={4}>
            <Text fontWeight="semibold" mb={2}>
              Тренд точности (accuracy)
            </Text>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={clsPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="ts" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="accuracy"
                  stroke="#805AD5"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card p={4}>
            <Text fontWeight="semibold" mb={2}>
              Тренд R2
            </Text>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={regPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="ts" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="r2"
                  name="r2"
                  stroke="#38A169"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card p={0} overflowX="auto" padding={2}>
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
        </>
      )}
    </Stack>
  );
}

export default MetricsPage;
