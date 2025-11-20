import React from "react";
import { ArrowForwardIcon, InfoOutlineIcon, RepeatIcon } from "@chakra-ui/icons";
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
  Text,
  Tooltip,
} from "@chakra-ui/react";
import GlowingCard from "../../../components/common/GlowingCard";
import { ErrorAlert } from "../../../components";
import JobStatusPanel from "./JobStatusPanel";
import StatTile from "./StatTile";
import { formatDateTime } from "../utils";

export default function TrainingRunLauncher({
  datasets,
  datasetsLoading,
  datasetsError,
  onDismissDatasetsError,
  selectedDatasetId,
  onSelectDataset,
  selectedDataset,
  targetColumn,
  onSelectTargetColumn,
  onRefreshDatasets,
  onStartJob,
  launchingPreset,
  jobError,
  onDismissJobError,
  jobInfo,
  onRefreshStatus,
  isPolling,
}) {
  return (
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
          <ErrorAlert description={datasetsError} onClose={onDismissDatasetsError} />
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <Box>
            <Text fontSize="xs" textTransform="uppercase" color="text.tertiary" mb={2}>
              Датасет
            </Text>
            <Select
              placeholder={datasetsLoading ? "Загружаем датасеты..." : "Выберите датасет"}
              value={selectedDatasetId}
              onChange={(e) => onSelectDataset(e.target.value)}
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
                <StatTile
                  label="Версия"
                  value={selectedDataset.version ? `v${selectedDataset.version}` : "—"}
                />
                <StatTile label="Загружен" value={formatDateTime(selectedDataset.created_at)} />
                <StatTile label="ID" value={selectedDataset.id} truncate />
              </Stack>
            )}

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
                  placeholder="Выберите столбец для target"
                  value={targetColumn}
                  onChange={(e) => onSelectTargetColumn(e.target.value)}
                  bg="whiteAlpha.100"
                  borderColor="whiteAlpha.300"
                  isDisabled={datasetsLoading}
                >
                  {(selectedDataset.columns || selectedDataset.meta?.columns || []).map((column) => (
                    <option key={column} value={column}>
                      {column}
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
              onClick={onStartJob}
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
                onClick={onRefreshStatus}
                isLoading={isPolling}
                isDisabled={!jobInfo?.job_id}
              >
                Обновить статус
              </Button>
              <Button size="sm" variant="ghost" onClick={onRefreshDatasets} isLoading={datasetsLoading}>
                Обновить датасеты
              </Button>
            </HStack>
            {jobError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box flex="1">
                  {jobError}
                </Box>
                <Button size="xs" variant="link" onClick={onDismissJobError}>
                  Скрыть
                </Button>
              </Alert>
            )}
            <JobStatusPanel jobInfo={jobInfo} />
          </Stack>
        </SimpleGrid>
      </Stack>
    </GlowingCard>
  );
}
