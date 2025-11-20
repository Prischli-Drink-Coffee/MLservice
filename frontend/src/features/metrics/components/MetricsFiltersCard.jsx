import React from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Card from "../../../components/common/Card";

function MetricsFiltersCard({
  datasets,
  datasetsLoading,
  datasetsError,
  selectedDatasetId,
  onDatasetChange,
  selectedDataset,
  targetColumn,
  onTargetChange,
  targetOptions,
  metricsLoading,
  onRefresh,
  metricsError,
}) {
  return (
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
              onChange={(e) => onDatasetChange(e.target.value)}
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
              onChange={(e) => onTargetChange(e.target.value)}
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
              onClick={onRefresh}
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
  );
}

export default MetricsFiltersCard;
