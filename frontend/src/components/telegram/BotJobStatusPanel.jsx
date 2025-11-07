import React from "react";
import {
  Box,
  Badge,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Spinner,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiClock,
  FiActivity,
  FiList,
  FiCheck,
  FiX,
  FiCpu,
  FiShare2,
  FiMessageSquare,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "../../theme/tokens";
import { getJobStatus } from "../../API/telegram";

const MotionBox = motion(Box);

const statusLabels = {
  pending: "В ожидании",
  processing: "В обработке",
  distributed: "Передано воркерам",
  running: "Выполняется",
  completed: "Завершено",
  success: "Завершено",
  failed: "Ошибка",
  error: "Ошибка",
};

const statusColorMap = {
  pending: "yellow",
  processing: "blue",
  distributed: "purple",
  running: "purple",
  completed: "green",
  success: "green",
  failed: "red",
  error: "red",
  unknown: "gray",
};

const resolveStatus = (entry) => {
  const rawStatus = entry?.distributed_job?.status || entry?.status || "unknown";
  return rawStatus.toLowerCase();
};

const getStatusColorScheme = (status) => statusColorMap[status] || "gray";

const formatStatusLabel = (status) => {
  if (!status) {
    return "Неизвестно";
  }
  if (statusLabels[status]) {
    return statusLabels[status];
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("ru-RU") : "—");

const truncateId = (value) => (value ? `${value.slice(0, 8)}…` : null);

function BotJobStatusPanel({ botId, graphs = [], isVisible = true }) {
  const [jobStatus, setJobStatus] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Не загружаем данные, если компонент не виден
    if (!isVisible) {
      return;
    }

    let isMounted = true;

    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const data = await getJobStatus(botId);
        if (isMounted) {
          setJobStatus(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Обновляем каждые 5 секунд

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [botId, isVisible]);

  const graphsLookup = React.useMemo(() => {
    if (!Array.isArray(graphs) || graphs.length === 0) {
      return new Map();
    }
    return new Map(graphs.map((graph) => [graph.id, graph.name]));
  }, [graphs]);

  const graphNames = React.useMemo(() => {
    const ids = Array.isArray(jobStatus?.graph_ids) ? jobStatus.graph_ids : [];
    return ids.map((gid) => graphsLookup.get(gid) ?? `Граф ${gid.slice(0, 8)}`);
  }, [graphsLookup, jobStatus?.graph_ids]);

  const metrics = React.useMemo(() => {
    if (!jobStatus) {
      return {
        queueCounts: {},
        totalMessages: 0,
        activeDistributed: [],
        visibleRecentMessages: [],
        totalDistributed: 0,
        activeCount: 0,
        completedCount: 0,
        failedCount: 0,
      };
    }

    const queueCounts = jobStatus.queue_counts || {};
    const totalMessages = Object.values(queueCounts).reduce((sum, count) => sum + count, 0);
    const distributedSummary = jobStatus.distributed_jobs || {};
    const distributedCounts = distributedSummary.counts || {};
    const activeDistributed = distributedSummary.active || [];
    const recentMessages = jobStatus.recent_messages || [];
    const visibleRecentMessages = recentMessages.slice(0, 5);
    const totalDistributed =
      distributedCounts.total ?? (distributedSummary.recent ? distributedSummary.recent.length : 0);
    const activeCount = distributedCounts.active ?? activeDistributed.length;
    const completedCount = distributedCounts.completed ?? 0;
    const failedCount = distributedCounts.failed ?? 0;

    return {
      queueCounts,
      totalMessages,
      activeDistributed,
      visibleRecentMessages,
      totalDistributed,
      activeCount,
      completedCount,
      failedCount,
    };
  }, [jobStatus]);

  const {
    queueCounts,
    totalMessages,
    activeDistributed,
    visibleRecentMessages,
    totalDistributed,
    activeCount,
    completedCount,
    failedCount,
  } = metrics;

  if (isLoading && !jobStatus) {
    return (
      <Flex justify="center" align="center" py={8}>
        <VStack spacing={3}>
          <Spinner size="lg" color={tokens.colors.brand.primary} thickness="3px" />
          <Text fontSize="sm" color={tokens.colors.text.tertiary}>
            Загрузка статуса...
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={4} borderRadius="lg" bg="red.900" borderWidth="1px" borderColor="red.500">
        <HStack spacing={2}>
          <Icon as={FiX} color="red.400" />
          <Text fontSize="sm" color="red.300">
            Не удалось загрузить статус: {error}
          </Text>
        </HStack>
      </Box>
    );
  }

  if (!jobStatus) return null;

  return (
    <AnimatePresence mode="wait">
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        p={5}
        bg={"gray.900"}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={tokens.colors.border.default}
      >
        <VStack spacing={4} align="stretch">
          <Flex align="center" justify="space-between">
            <HStack spacing={2}>
              <Icon as={FiActivity} boxSize={5} color={tokens.colors.brand.primary} />
              <Heading size="sm" color={tokens.colors.text.primary}>
                Статус работы
              </Heading>
            </HStack>
            {isLoading && <Spinner size="sm" color={tokens.colors.brand.primary} />}
          </Flex>

          <Divider borderColor={tokens.colors.border.default} />

          {/* Основные метрики */}
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }}
            gap={4}
          >
            <GridItem>
              <Stat
                p={3}
                borderRadius="lg"
                bg={"gray.900"}
                borderWidth="1px"
                borderColor={tokens.colors.border.subtle}
              >
                <StatLabel fontSize="xs" color={tokens.colors.text.tertiary}>
                  <HStack spacing={1}>
                    <Icon as={FiCpu} boxSize={3} />
                    <Text>Статус задачи</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="md" color={tokens.colors.text.primary} mt={1}>
                  {jobStatus.job_status}
                </StatNumber>
              </Stat>
            </GridItem>

            <GridItem>
              <Stat
                p={3}
                borderRadius="lg"
                bg={"gray.900"}
                borderWidth="1px"
                borderColor={tokens.colors.border.subtle}
              >
                <StatLabel fontSize="xs" color={tokens.colors.text.tertiary}>
                  <HStack spacing={1}>
                    <Icon as={FiList} boxSize={3} />
                    <Text>Очередь сообщений</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="md" color={tokens.colors.text.primary} mt={1}>
                  {totalMessages}
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0}>
                  {Object.entries(queueCounts).map(([status, count]) => (
                    <Badge key={status} mr={1} fontSize="2xs">
                      {status}: {count}
                    </Badge>
                  ))}
                </StatHelpText>
              </Stat>
            </GridItem>

            <GridItem>
              <Stat
                p={3}
                borderRadius="lg"
                bg={"gray.900"}
                borderWidth="1px"
                borderColor={tokens.colors.border.subtle}
              >
                <StatLabel fontSize="xs" color={tokens.colors.text.tertiary}>
                  <HStack spacing={1}>
                    <Icon as={FiClock} boxSize={3} />
                    <Text>Последняя обработка</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="xs" color={tokens.colors.text.primary} mt={1}>
                  {jobStatus.last_processed
                    ? new Date(jobStatus.last_processed).toLocaleString("ru-RU")
                    : "Нет данных"}
                </StatNumber>
              </Stat>
            </GridItem>

            <GridItem>
              <Stat
                p={3}
                borderRadius="lg"
                bg={"gray.900"}
                borderWidth="1px"
                borderColor={tokens.colors.border.subtle}
              >
                <StatLabel fontSize="xs" color={tokens.colors.text.tertiary}>
                  <HStack spacing={1}>
                    <Icon as={FiShare2} boxSize={3} />
                    <Text>Распределённые задачи</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="md" color={tokens.colors.text.primary} mt={1}>
                  {totalDistributed}
                </StatNumber>
                <StatHelpText fontSize="xs" mb={0} color={tokens.colors.text.tertiary}>
                  Активно: {activeCount} • Завершено: {completedCount} • Ошибки: {failedCount}
                </StatHelpText>
              </Stat>
            </GridItem>
          </Grid>

          {/* Используемые графы */}
          {graphNames.length > 0 && (
            <>
              <Divider borderColor={tokens.colors.border.default} />
              <Box>
                <HStack spacing={2} mb={2}>
                  <Icon as={FiCheck} boxSize={4} color={tokens.colors.success.main} />
                  <Text fontSize="sm" fontWeight="medium" color={tokens.colors.text.primary}>
                    Используемые графы ({graphNames.length})
                  </Text>
                </HStack>
                <Flex wrap="wrap" gap={2}>
                  {graphNames.map((name, idx) => (
                    <Badge
                      key={idx}
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg={"blue.50"}
                      color={"blue.700"}
                      fontSize="xs"
                      fontWeight="medium"
                    >
                      {name}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            </>
          )}

          <Divider borderColor={tokens.colors.border.default} />

          <Box>
            <HStack spacing={2} mb={2}>
              <Icon as={FiShare2} boxSize={4} color={tokens.colors.brand.primary} />
              <Text fontSize="sm" fontWeight="medium" color={tokens.colors.text.primary}>
                Активные распределённые задачи ({activeDistributed.length})
              </Text>
            </HStack>
            {!activeDistributed.length ? (
              <Text fontSize="sm" color={tokens.colors.text.tertiary}>
                Активных распределённых задач сейчас нет.
              </Text>
            ) : (
              <Stack spacing={3}>
                {activeDistributed.map((entry) => {
                  const status = resolveStatus(entry);
                  return (
                    <Box
                      key={`active-${entry.distributed_job_id || entry.message_id}`}
                      p={3}
                      borderRadius="lg"
                      bg={"gray.900"}
                      borderWidth="1px"
                      borderColor={tokens.colors.border.subtle}
                    >
                      <Flex justify="space-between" align="center" mb={1}>
                        <HStack spacing={2}>
                          {entry.distributed_job_id && (
                            <Badge colorScheme="purple" fontSize="2xs">
                              Job {truncateId(entry.distributed_job_id)}
                            </Badge>
                          )}
                          <Text fontSize="xs" color={tokens.colors.text.tertiary}>
                            Сообщение {truncateId(entry.message_id) || entry.message_id}
                          </Text>
                        </HStack>
                        <Badge colorScheme={getStatusColorScheme(status)}>
                          {formatStatusLabel(status)}
                        </Badge>
                      </Flex>
                      {entry.message_preview && (
                        <Text fontSize="sm" color={tokens.colors.text.primary}>
                          {entry.message_preview}
                        </Text>
                      )}
                      <HStack mt={2} spacing={4} fontSize="xs" color={tokens.colors.text.tertiary}>
                        <HStack spacing={1}>
                          <Icon as={FiClock} boxSize={3} />
                          <Text>{formatDateTime(entry.updated_at || entry.created_at)}</Text>
                        </HStack>
                        {entry.distributed_job?.active_nodes !== undefined && (
                          <HStack spacing={1}>
                            <Icon as={FiCpu} boxSize={3} />
                            <Text>Нод: {entry.distributed_job.active_nodes}</Text>
                          </HStack>
                        )}
                      </HStack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Divider borderColor={tokens.colors.border.default} />

          <Box>
            <HStack spacing={2} mb={2}>
              <Icon as={FiMessageSquare} boxSize={4} color={tokens.colors.brand.primary} />
              <Text fontSize="sm" fontWeight="medium" color={tokens.colors.text.primary}>
                Недавние сообщения ({visibleRecentMessages.length})
              </Text>
            </HStack>
            {!visibleRecentMessages.length ? (
              <Text fontSize="sm" color={tokens.colors.text.tertiary}>
                Очередь пуста — новых сообщений пока нет.
              </Text>
            ) : (
              <Stack spacing={3}>
                {visibleRecentMessages.map((entry) => {
                  const status = resolveStatus(entry);
                  return (
                    <Box
                      key={entry.message_id}
                      p={3}
                      borderRadius="lg"
                      bg={"gray.900"}
                      borderWidth="1px"
                      borderColor={tokens.colors.border.subtle}
                    >
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="medium" color={tokens.colors.text.primary}>
                          Сообщение {truncateId(entry.message_id) || entry.message_id}
                        </Text>
                        <Badge colorScheme={getStatusColorScheme(status)}>
                          {formatStatusLabel(status)}
                        </Badge>
                      </Flex>
                      {entry.message_preview && (
                        <Text mt={2} fontSize="sm" color={tokens.colors.text.secondary}>
                          {entry.message_preview}
                        </Text>
                      )}
                      <Flex
                        mt={2}
                        gap={4}
                        wrap="wrap"
                        fontSize="xs"
                        color={tokens.colors.text.tertiary}
                      >
                        <HStack spacing={1}>
                          <Icon as={FiClock} boxSize={3} />
                          <Text>
                            {formatDateTime(
                              entry.processed_at || entry.updated_at || entry.created_at,
                            )}
                          </Text>
                        </HStack>
                        {entry.distributed_job_id && (
                          <HStack spacing={1}>
                            <Icon as={FiShare2} boxSize={3} />
                            <Text>Job {truncateId(entry.distributed_job_id)}</Text>
                          </HStack>
                        )}
                        {entry.response_summary?.response_count !== undefined && (
                          <HStack spacing={1}>
                            <Icon as={FiList} boxSize={3} />
                            <Text>Ответов: {entry.response_summary.response_count}</Text>
                          </HStack>
                        )}
                        {entry.response_summary?.result_nodes !== undefined && (
                          <HStack spacing={1}>
                            <Icon as={FiCpu} boxSize={3} />
                            <Text>Нод: {entry.response_summary.result_nodes}</Text>
                          </HStack>
                        )}
                      </Flex>
                      {entry.error_message && (
                        <Text mt={2} fontSize="xs" color="red.300">
                          Ошибка: {entry.error_message}
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Webhook URL */}
          {jobStatus.webhook_url && (
            <>
              <Divider borderColor={tokens.colors.border.default} />
              <Box>
                <Text fontSize="xs" color={tokens.colors.text.tertiary} mb={1}>
                  Webhook URL:
                </Text>
                <Text
                  fontSize="xs"
                  fontFamily="mono"
                  color={tokens.colors.text.secondary}
                  p={2}
                  bg={"gray.900"}
                  borderRadius="md"
                  wordBreak="break-all"
                >
                  {jobStatus.webhook_url}
                </Text>
              </Box>
            </>
          )}
        </VStack>
      </MotionBox>
    </AnimatePresence>
  );
}

function graphsShallowEqual(prevGraphs = [], nextGraphs = []) {
  if (prevGraphs === nextGraphs) return true;
  if (prevGraphs.length !== nextGraphs.length) return false;
  for (let i = 0; i < prevGraphs.length; i += 1) {
    const prev = prevGraphs[i];
    const next = nextGraphs[i];
    if (prev?.id !== next?.id || prev?.updated_at !== next?.updated_at) {
      return false;
    }
  }
  return true;
}

const arePropsEqual = (prev, next) => {
  return (
    prev.botId === next.botId &&
    prev.isVisible === next.isVisible &&
    graphsShallowEqual(prev.graphs, next.graphs)
  );
};

export default React.memo(BotJobStatusPanel, arePropsEqual);
