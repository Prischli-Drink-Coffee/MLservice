import React, { useCallback, useEffect, useState } from "react";
import { Stack, Table, Thead, Tbody, Tr, Th, Td, IconButton, Text, useToast } from "@chakra-ui/react";
import { FiTrash2, FiDownload } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import { listArtifacts, deleteArtifact } from "../API";

function ArtifactsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listArtifacts({ limit: 50 });
      setItems(data);
    } catch (e) {
      toast({ title: "Ошибка", description: e.response?.data?.detail || e.message, status: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id) => {
    try {
      await deleteArtifact(id);
      toast({ title: "Удалено", status: "success" });
      await fetchItems();
    } catch (e) {
      toast({ title: "Не удалось удалить", description: e.response?.data?.detail || e.message, status: "error" });
    }
  };

  return (
    <Stack spacing={6}>
      <PageHeader title="Артефакты моделей" subtitle="Хранение экспортированных моделей" />
      <Card p={0} overflowX="auto">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Дата</Th>
              <Th>URL</Th>
              <Th>Метрики</Th>
              <Th textAlign="right">Действия</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((m) => (
              <Tr key={m.id}>
                <Td>{new Date(m.created_at).toLocaleString()}</Td>
                <Td maxW="320px" wordBreak="break-all">{m.model_url}</Td>
                <Td fontSize="xs">
                  {m.metrics ? (
                    <Stack spacing={0}>
                      <Text>task: {m.metrics.task}</Text>
                      {m.metrics.accuracy != null && <Text>accuracy: {m.metrics.accuracy}</Text>}
                      {m.metrics.r2 != null && <Text>r2: {m.metrics.r2}</Text>}
                      {m.metrics.mse != null && <Text>mse: {m.metrics.mse}</Text>}
                      {m.metrics.mae != null && <Text>mae: {m.metrics.mae}</Text>}
                    </Stack>
                  ) : (
                    <Text color="text.muted">N/A</Text>
                  )}
                </Td>
                <Td>
                  <Stack direction="row" justify="flex-end" spacing={2}>
                    <IconButton
                      size="sm"
                      aria-label="Скачать"
                      icon={<FiDownload />}
                      as="a"
                      href={m.model_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline"
                    />
                    <IconButton
                      size="sm"
                      aria-label="Удалить"
                      icon={<FiTrash2 />}
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDelete(m.id)}
                      isDisabled={loading}
                    />
                  </Stack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </Stack>
  );
}

export default ArtifactsPage;
