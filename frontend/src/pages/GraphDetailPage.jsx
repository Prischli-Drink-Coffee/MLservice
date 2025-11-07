import React from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getGraph, listExecutions } from "../API/graphs";
import { LoadingState, ErrorAlert } from "../components";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function GraphDetailPage() {
  const navigate = useNavigate();
  const { graphId } = useParams();
  const [graph, setGraph] = React.useState(null);
  const [executions, setExecutions] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fetchGraph = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [graphResponse, executionsResponse] = await Promise.all([
        getGraph(graphId),
        listExecutions(graphId, { limit: 10 }),
      ]);
      setGraph(graphResponse);
      setExecutions(executionsResponse ?? []);
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [graphId]);

  React.useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  if (isLoading && !graph) {
    return <LoadingState label="Загружаем данные графа" />;
  }

  if (error && !graph) {
    return (
      <Stack spacing={4}>
        <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={() => navigate(-1)}>
          Назад
        </Button>
        <ErrorAlert description={error} />
      </Stack>
    );
  }

  if (!graph) {
    return (
      <Stack spacing={4}>
        <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Text>Граф не найден.</Text>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <PageHeader
        title={graph.name}
        subtitle={graph.description}
        actions={
          <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={() => navigate(-1)}>
            Назад
          </Button>
        }
      />
      <HStack spacing={3}>
        <Badge colorScheme={graph.is_active ? "green" : "gray"}>
          {graph.is_active ? "Активен" : "Выключен"}
        </Badge>
        <Badge colorScheme="purple">Версия {graph.version}</Badge>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Card p={4}>
          <Text fontWeight="semibold" mb={2}>
            Метаданные
          </Text>
          <VStack align="start" spacing={2} fontSize="sm">
            <Text>
              <Text as="span" fontWeight="medium">
                Создан:
              </Text>{" "}
              {formatDate(graph.created_at)}
            </Text>
            <Text>
              <Text as="span" fontWeight="medium">
                Обновлён:
              </Text>{" "}
              {formatDate(graph.updated_at ?? graph.created_at)}
            </Text>
            <Text>
              <Text as="span" fontWeight="medium">
                Кол-во нод:
              </Text>{" "}
              {graph.nodes?.length ?? 0}
            </Text>
            <Text>
              <Text as="span" fontWeight="medium">
                Кол-во связей:
              </Text>{" "}
              {graph.edges?.length ?? 0}
            </Text>
          </VStack>
        </Card>

        <Card p={4}>
          <Text fontWeight="semibold" mb={2}>
            Последние выполнения
          </Text>
          {executions.length === 0 ? (
            <Text fontSize="sm" color="text.muted">
              Выполнения отсутствуют.
            </Text>
          ) : (
            <VStack align="stretch" spacing={3} fontSize="sm">
              {executions.map((execution) => (
                <Card key={execution.id} p={3}>
                  <HStack justify="space-between" mb={1}>
                    <Badge
                      colorScheme={
                        execution.status === "completed"
                          ? "green"
                          : execution.status === "failed"
                            ? "red"
                            : "blue"
                      }
                    >
                      {execution.status}
                    </Badge>
                    <Text color="text.muted">{formatDate(execution.created_at)}</Text>
                  </HStack>
                  {execution.output_data && (
                    <Text color="text.muted" noOfLines={2}>
                      {JSON.stringify(execution.output_data)}
                    </Text>
                  )}
                </Card>
              ))}
            </VStack>
          )}
        </Card>
      </SimpleGrid>

      <Divider />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Card p={4} overflow="auto">
          <Text fontWeight="semibold" mb={2}>
            Ноды
          </Text>
          <Box as="pre" fontSize="sm" whiteSpace="pre-wrap">
            {JSON.stringify(graph.nodes ?? [], null, 2)}
          </Box>
        </Card>
        <Card p={4} overflow="auto">
          <Text fontWeight="semibold" mb={2}>
            Связи
          </Text>
          <Box as="pre" fontSize="sm" whiteSpace="pre-wrap">
            {JSON.stringify(graph.edges ?? [], null, 2)}
          </Box>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}

export default GraphDetailPage;
