import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
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
  Tooltip,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { ArrowForwardIcon, RepeatIcon, SearchIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import GlowingCard from "../components/common/GlowingCard";
import DatasetSearchBar from "../components/datasets/DatasetSearchBar";
import { EmptyState, ErrorAlert, LoadingState } from "../components";
import { listDatasets, listTrainingRuns, startJob, fetchJobResult } from "../API";

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

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const STATUS_COLORS = {
  NEW: "purple",
  PROCESSING: "yellow",
  SUCCESS: "green",
  FAILURE: "red",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function TrainingRunsPage() {
  const toast = useToast();
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [datasetsError, setDatasetsError] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [targetColumn, setTargetColumn] = useState("");

  const [launchingPreset, setLaunchingPreset] = useState(null);
  const [jobInfo, setJobInfo] = useState(null);
  const [jobError, setJobError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    setRunsError(null);
    try {
      const data = await listTrainingRuns({ limit: 50 });
      setRuns(data);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Не удалось загрузить запуски";
      setRunsError(message);
    } finally {
      setRunsLoading(false);
    }
  }, []);

  const loadDatasets = useCallback(async () => {
    setDatasetsLoading(true);
    setDatasetsError(null);
    try {
      const data = await listDatasets({ limit: 50 });
      setDatasets(data);
      setSelectedDatasetId((prev) => prev || data[0]?.id || "");
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Не удалось загрузить датасеты";
      setDatasetsError(message);
    } finally {
      setDatasetsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  // when selected dataset changes, try to set a default target column
  useEffect(() => {
    const ds = datasets.find((d) => d.id === selectedDatasetId) || null;
    const cols = (ds?.columns || ds?.meta?.columns || []).slice?.() || [];
    if (cols.length > 0) {
      setTargetColumn((prev) => prev || cols[cols.length - 1] || cols[0]);
    } else {
      setTargetColumn("");
    }
  }, [selectedDatasetId, datasets]);

  const pollJobResult = useCallback(
    async (jobId) => {
      if (!jobId) return;
      setIsPolling(true);
      try {
        const maxAttempts = 6;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          const latest = await fetchJobResult(jobId);
          setJobInfo(latest);
          if (["SUCCESS", "FAILURE"].includes(latest.status)) {
            const statusText = latest.status === "SUCCESS" ? "Обучение завершено" : "Обучение завершилось ошибкой";
            toast({ title: statusText, status: latest.status === "SUCCESS" ? "success" : "error" });
            await loadRuns();
            return latest;
          }
          await sleep(1500 + attempt * 500);
        }
        toast({ title: "Статус обновлён", description: "Обучение ещё в процессе", status: "info" });
      } catch (error) {
        const message = error.response?.data?.detail || error.message || "Не удалось получить статус";
        setJobError(message);
        toast({ title: "Ошибка статуса", description: message, status: "error" });
      } finally {
        setIsPolling(false);
      }
    },
    [loadRuns, toast],
  );

  const handleStartJob = async () => {
    if (!selectedDatasetId) {
      toast({ title: "Выберите датасет", description: "Нельзя запустить обучение без датасета", status: "warning" });
      return;
    }
    setLaunchingPreset("standard");
    setJobError(null);
    try {
      const response = await startJob({ datasetId: selectedDatasetId, targetColumn, mode: "TRAINING", type: "TRAIN" });
      setJobInfo(response);
      toast({
        title: "Обучение запущено",
        description: `ID задачи: ${response.job_id}`,
        status: "success",
      });
      await pollJobResult(response.job_id);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Не удалось запустить обучение";
      setJobError(message);
      toast({ title: "Ошибка запуска", description: message, status: "error" });
    } finally {
      setLaunchingPreset(null);
    }
  };

  const handleRefreshStatus = async () => {
    if (!jobInfo?.job_id) {
      toast({ title: "Нет активной задачи", description: "Сначала запустите обучение", status: "info" });
      return;
    }
    setJobError(null);
    await pollJobResult(jobInfo.job_id);
  };

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) || null,
    [datasets, selectedDatasetId],
  );

  // Фильтруем запуски по поисковому запросу
  const filteredRuns = useMemo(() => {
    if (!searchQuery.trim()) return runs;
    const query = searchQuery.toLowerCase();
    return runs.filter((r) => {
      const dateStr = formatDateTime(r.created_at).toLowerCase();
      const metricsStr = JSON.stringify(r.metrics || {}).toLowerCase();
      return dateStr.includes(query) || metricsStr.includes(query) || r.id.toString().includes(query);
    });
  }, [runs, searchQuery]);

  const renderJobStatus = () => {
    if (!jobInfo) return null;
    const statusColorScheme = STATUS_COLORS[jobInfo.status] || "gray";
    const statusAccent = `${statusColorScheme}.300`;
    return (
      <Box border="1px solid" borderColor="whiteAlpha.200" borderRadius="lg" p={4} bg="blackAlpha.300">
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack spacing={3} align="center">
            <Badge colorScheme={statusColorScheme} fontSize="xs" px={3} py={1} borderRadius="full">
              {jobInfo.status}
            </Badge>
            <Text fontSize="sm" color="text.muted">
              ID задачи: {jobInfo.job_id}
            </Text>
          </HStack>
          {jobInfo.model_url && (
            <Button as="a" href={jobInfo.model_url} size="sm" target="_blank" rel="noreferrer" variant="ghost" rightIcon={<ArrowForwardIcon />}>
              Скачать модель
            </Button>
          )}
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
          <StatTile label="Осталось запусков" value={jobInfo.available_launches ?? "—"} />
          <StatTile label="Ожидание (сек.)" value={jobInfo.wait_time_sec ?? "—"} />
          <StatTile label="Статус" value={jobInfo.status} accent={statusAccent} />
        </SimpleGrid>
        {jobInfo.metrics && (
          <Box mt={4}>
            <Text fontSize="sm" color="text.muted" mb={2}>
              Метрики последнего запуска
            </Text>
            {renderMetrics(jobInfo.metrics)}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Stack spacing={6}>
      <PageHeader title="Запуски обучения" subtitle="История запусков, запуск новых обучений" />

      <GlowingCard intensity="strong">
        <Stack spacing={5}>
          <Stack spacing={1}>
            <Text fontSize="lg" fontWeight={600} color="text.primary">
              Запустить новое обучение
            </Text>
            <Text fontSize="sm" color="text.tertiary">
              Выберите актуальный датасет и запустите пайплайн. После старта статус появится ниже и в таблице запусков.
            </Text>
          </Stack>

          {datasetsError && (
            <ErrorAlert description={datasetsError} onClose={() => setDatasetsError(null)} />
          )}

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <Box>
              <Text fontSize="xs" textTransform="uppercase" color="text.tertiary" mb={2}>
                Датасет
              </Text>
                <Select
                  placeholder={datasetsLoading ? "Загружаем датасеты..." : "Выберите датасет"}
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  bg="whiteAlpha.100"
                  borderColor="whiteAlpha.300"
                  isDisabled={datasets.length === 0 || datasetsLoading}
                >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name || dataset.meta?.name || dataset.id}
                  </option>
                ))}
              </Select>
              {datasetsLoading && (
                <HStack spacing={2} mt={2} color="text.muted">
                  <Spinner size="sm" />
                  <Text fontSize="sm">Обновляем список датасетов...</Text>
                </HStack>
              )}
              {selectedDataset && (
                <Stack direction={{ base: "column", md: "row" }} spacing={4} mt={4}>
                  <StatTile label="Версия" value={selectedDataset.version ? `v${selectedDataset.version}` : "—"} />
                  <StatTile label="Загружен" value={formatDateTime(selectedDataset.created_at)} />
                  <StatTile label="ID" value={selectedDataset.id} truncate />
                </Stack>
              )}

              {/* Target column selector (MVP) */}
              {selectedDataset && (
                <Box mt={4}>
                  <Text
                    fontSize="xs"
                    textTransform="uppercase"
                    color="text.tertiary"
                    mb={2}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    Целевой столбец (target)
                    <Tooltip
                      label="Определяет, какую колонку модель будет предсказывать. Если не выбрать, мы попытаемся угадать target автоматически."
                      hasArrow
                      placement="top"
                    >
                      <InfoOutlineIcon />
                    </Tooltip>
                  </Text>
                  <Select
                    placeholder={"Выберите столбец для target"}
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    bg="whiteAlpha.100"
                    borderColor="whiteAlpha.300"
                    isDisabled={datasetsLoading}
                  >
                    {(selectedDataset.columns || selectedDataset.meta?.columns || []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Box>
              )}
            </Box>

            <Stack spacing={3}>
              <Button
                size="lg"
                colorScheme="brand"
                rightIcon={<ArrowForwardIcon />}
                onClick={handleStartJob}
                isLoading={launchingPreset === "standard"}
                isDisabled={!selectedDatasetId || datasetsLoading}
              >
                Запустить обучение
              </Button>
              <HStack spacing={3} flexWrap="wrap">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<RepeatIcon />}
                  onClick={handleRefreshStatus}
                  isLoading={isPolling}
                  isDisabled={!jobInfo?.job_id}
                >
                  Обновить статус
                </Button>
                <Button size="sm" variant="ghost" onClick={loadDatasets} isLoading={datasetsLoading}>
                  Обновить датасеты
                </Button>
              </HStack>
              {jobError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {jobError}
                </Alert>
              )}
              {renderJobStatus()}
            </Stack>
          </SimpleGrid>
        </Stack>
      </GlowingCard>

      {/* Поиск запусков */}
      <Box maxW="900px">
        <DatasetSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          totalCount={runs.length}
          filteredCount={filteredRuns.length}
          placeholder="Поиск по дате, метрикам, ID или URL модели..."
        />
      </Box>

      {runsError && (
        <ErrorAlert description={runsError} onClose={() => setRunsError(null)} />
      )}

      {runsLoading && runs.length === 0 ? (
        <Card>
          <LoadingState label="Загружаем историю запусков" />
        </Card>
      ) : filteredRuns.length === 0 && searchQuery ? (
        <EmptyState title="Ничего не найдено" description={`По запросу "${searchQuery}" запуски не найдены`} />
      ) : runs.length === 0 ? (
        <EmptyState title="Запуски отсутствуют" description="Запустите обучение, чтобы увидеть статистику" />
      ) : (
        <Card p={0} overflowX="auto" padding={2}>
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
                  <Td>{formatDateTime(r.created_at)}</Td>
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

const StatTile = ({ label, value, accent, truncate = false }) => (
  <VStack
    align="flex-start"
    spacing={1}
    p={3}
    borderRadius="md"
    border="1px solid"
    borderColor="whiteAlpha.200"
    bg="whiteAlpha.50"
  >
    <Text fontSize="xs" textTransform="uppercase" color="text.tertiary">
      {label}
    </Text>
    <Text
      fontWeight={600}
      color={accent || "text.primary"}
      fontSize="sm"
      noOfLines={truncate ? 1 : undefined}
      wordBreak={truncate ? "break-all" : "normal"}
    >
      {value ?? "—"}
    </Text>
  </VStack>
);

export default TrainingRunsPage;
