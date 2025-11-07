import React, { useCallback, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  SimpleGrid,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, RepeatIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { Link } from "@chakra-ui/react";
import { FiTrash2 } from "react-icons/fi";

import { ErrorAlert, EmptyState, LoadingState, ConfirmDialog } from "../components";
import PageHeader from "../components/common/PageHeader";
import GraphFormDrawer from "../components/graphs/GraphFormDrawer";
import { createGraph, deleteGraph, listGraphs, updateGraph } from "../API";
import Card from "../components/common/Card";

function GraphsPage() {
  const toast = useToast();
  const [graphs, setGraphs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [deleteGraphId, setDeleteGraphId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const drawerDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();

  const fetchGraphs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listGraphs({ activeOnly: false });
      setGraphs(response.graphs ?? []);
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGraphs();
  }, [fetchGraphs]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchGraphs();
      toast({ title: "Список обновлён", status: "success" });
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      toast({ title: "Не удалось обновить", description: message, status: "error" });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchGraphs, toast]);

  const handleCreate = () => {
    // перейти в визуальный конструктор
    window.location.hash = "#/builder";
  };

  // Editing handled via opening drawer with selectedGraph in table actions

  const handleSubmit = async (payload) => {
    if (selectedGraph) {
      await updateGraph(selectedGraph.id, payload);
      toast({ title: "Граф обновлён", status: "success" });
    } else {
      await createGraph(payload);
      toast({ title: "Граф создан", status: "success" });
    }
    await fetchGraphs();
  };

  const askDelete = (graphId) => {
    setDeleteGraphId(graphId);
    deleteDisclosure.onOpen();
  };

  const confirmDelete = async () => {
    if (!deleteGraphId) return;
    try {
      await deleteGraph(deleteGraphId);
      toast({ title: "Граф удалён", status: "success" });
      await fetchGraphs();
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      toast({ title: "Не удалось удалить граф", description: message, status: "error" });
    } finally {
      setDeleteGraphId(null);
      deleteDisclosure.onClose();
    }
  };

  const sortedGraphs = useMemo(() => {
    return [...graphs].sort(
      (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at),
    );
  }, [graphs]);

  if (isLoading && graphs.length === 0) {
    return <LoadingState label="Загружаем графы" />;
  }

  return (
    <Stack spacing={6}>
      <PageHeader
        title="Графы"
        subtitle="Управляйте графами, обновляйте структуру и запускайте выполнение"
        actions={
          <>
            <Button
              leftIcon={<RepeatIcon />}
              variant="ghost"
              onClick={handleRefresh}
              isLoading={isRefreshing}
            >
              Обновить
            </Button>
            <Button colorScheme="brand" leftIcon={<AddIcon />} onClick={handleCreate}>
              Новый граф
            </Button>
          </>
        }
      />

      {error && <ErrorAlert description={error} onClose={() => setError(null)} />}

      {sortedGraphs.length === 0 ? (
        <EmptyState
          title="Графы не найдены"
          description="Создайте первый граф, чтобы начать работу"
        />
      ) : (
        <>
          {/* Mobile cards */}
          <SimpleGrid columns={1} spacing={4} display={{ base: "grid", md: "none" }}>
            {sortedGraphs.map((graph) => (
              <Card key={graph.id} p={4}>
                <Stack spacing={2}>
                  <Text fontWeight="semibold">{graph.name}</Text>
                  {graph.description && (
                    <Text fontSize="sm" color="text.muted">
                      {graph.description}
                    </Text>
                  )}
                  <HStack>
                    <Badge colorScheme={graph.is_active ? "green" : "gray"}>
                      {graph.is_active ? "Активен" : "Выключен"}
                    </Badge>
                    <Badge colorScheme="purple">v{graph.version}</Badge>
                  </HStack>
                  <Text fontSize="xs" color="text.muted">
                    {new Date(graph.updated_at ?? graph.created_at).toLocaleString()}
                  </Text>
                  <HStack spacing={2}>
                    <Link
                      as={RouterLink}
                      to={`#/builder?graphId=${graph.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.hash = `#/builder/${graph.id}`;
                      }}
                    >
                      <IconButton size="sm" aria-label="Открыть" icon={<EditIcon />} />
                    </Link>
                    <IconButton
                      size="sm"
                      aria-label="Удалить"
                      icon={<FiTrash2 />}
                      colorScheme="red"
                      variant="outline"
                      onClick={() => askDelete(graph.id)}
                    />
                  </HStack>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
          {/* Desktop table */}
          <Card overflowX="auto" display={{ base: "none", md: "block" }} p={0}>
            <Table variant="simple">
              <Thead bg="surfaceElevated">
                <Tr>
                  <Th>Название</Th>
                  <Th>Статус</Th>
                  <Th>Версия</Th>
                  <Th>Обновлён</Th>
                  <Th textAlign="right">Действия</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedGraphs.map((graph) => (
                  <Tr key={graph.id} _hover={{ bg: "surfaceElevated" }}>
                    <Td>
                      <Stack spacing={1}>
                        <Text fontWeight="semibold">{graph.name}</Text>
                        {graph.description && (
                          <Text fontSize="sm" color="text.muted">
                            {graph.description}
                          </Text>
                        )}
                      </Stack>
                    </Td>
                    <Td>
                      <Badge colorScheme={graph.is_active ? "green" : "gray"}>
                        {graph.is_active ? "Активен" : "Выключен"}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="purple">v{graph.version}</Badge>
                    </Td>
                    <Td>
                      <HStack spacing={1} color="text.muted" fontSize="sm">
                        <Text>
                          {new Date(graph.updated_at ?? graph.created_at).toLocaleString()}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      <HStack spacing={2} justify="flex-end">
                        <Link
                          as={RouterLink}
                          to={`#/builder?graphId=${graph.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.hash = `#/builder/${graph.id}`;
                          }}
                        >
                          <IconButton
                            size="sm"
                            aria-label="Открыть в конструкторе"
                            icon={<EditIcon />}
                          />
                        </Link>
                        <IconButton
                          size="sm"
                          aria-label="Удалить"
                          icon={<FiTrash2 />}
                          colorScheme="red"
                          variant="outline"
                          onClick={() => askDelete(graph.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </>
      )}

      <GraphFormDrawer
        isOpen={drawerDisclosure.isOpen}
        onClose={() => {
          drawerDisclosure.onClose();
          setSelectedGraph(null);
        }}
        onSubmit={handleSubmit}
        initialGraph={selectedGraph}
      />

      <ConfirmDialog
        isOpen={deleteDisclosure.isOpen}
        onClose={() => {
          setDeleteGraphId(null);
          deleteDisclosure.onClose();
        }}
        onConfirm={confirmDelete}
        title="Удалить граф?"
        message="Граф и связанные выполнения будут удалены безвозвратно."
        confirmText="Удалить"
      />
    </Stack>
  );
}

export default GraphsPage;
