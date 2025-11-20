import React from "react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Badge, Box, Button, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import RunMetrics from "./RunMetrics";
import StatTile from "./StatTile";
import { STATUS_COLORS } from "../utils";

export default function JobStatusPanel({ jobInfo }) {
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
          <Button
            as="a"
            href={jobInfo.model_url}
            size="sm"
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            rightIcon={<ArrowForwardIcon />}
          >
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
        <Stack mt={4} spacing={1}>
          <Text fontSize="sm" color="text.muted">
            Метрики последнего запуска
          </Text>
          <RunMetrics metrics={jobInfo.metrics} />
        </Stack>
      )}
    </Box>
  );
}
