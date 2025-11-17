import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Stack, Table, Thead, Tbody, Tr, Th, Td, IconButton, Text, useToast } from "@chakra-ui/react";
import { FiTrash2, FiDownload } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import { listArtifacts, deleteArtifact, getArtifactDownloadUrl } from "../API";
import DatasetSearchBar from "../components/datasets/DatasetSearchBar";
import { EmptyState } from "../components";

const defaultOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || defaultOrigin || "";

const toAbsoluteApiUrl = (url) => {
  if (!url) return url;
  try {
    // If already absolute, return as-is
    const u = new URL(url);
    return u.toString();
  } catch (e) {
    // If relative (e.g. /storage/...), resolve against apiBaseUrl
    try {
      return new URL(url, apiBaseUrl || defaultOrigin || "").toString();
    } catch (err) {
      return url;
    }
  }
};

function ArtifactsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

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

  // Фильтруем артефакты по поисковому запросу
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((m) => {
      const dateStr = new Date(m.created_at).toLocaleString().toLowerCase();
      const urlStr = m.model_url.toLowerCase();
      const metricsStr = JSON.stringify(m.metrics).toLowerCase();
      return dateStr.includes(query) || urlStr.includes(query) || metricsStr.includes(query) || m.id.toString().includes(query);
    });
  }, [items, searchQuery]);

  const handleDelete = async (id) => {
    try {
      await deleteArtifact(id);
      toast({ title: "Удалено", status: "success" });
      await fetchItems();
    } catch (e) {
      toast({ title: "Не удалось удалить", description: e.response?.data?.detail || e.message, status: "error" });
    }
  };

  const handleDownload = async (artifact) => {
    setDownloadingId(artifact.id);
    try {
      const { url } = await getArtifactDownloadUrl(artifact.id);
      if (!url) {
        throw new Error("Не удалось получить ссылку на файл");
      }
      const absoluteUrl = toAbsoluteApiUrl(url);
      window.open(absoluteUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast({
        title: "Не удалось скачать",
        description: e.response?.data?.detail || e.message,
        status: "error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Stack spacing={6}>
      <PageHeader title="Артефакты моделей" subtitle="Хранение экспортированных моделей" />

      <DatasetSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery("")}
        totalCount={items.length}
        filteredCount={filteredItems.length}
        placeholder="Поиск по дате, URL, метрикам или ID..."
        title="Репозиторий артефактов"
        description="Отфильтруйте модели по идентификатору, ссылке или значениям метрик."
        counterLabel="Отображается:"
        badgeColorScheme="green"
      />

      {filteredItems.length === 0 && searchQuery ? (
        <EmptyState title="Ничего не найдено" description={`По запросу "${searchQuery}" артефакты не найдены`} />
      ) : (
        <Card p={0} overflowX="auto" padding={2}>
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
              {filteredItems.map((m) => (
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
                      variant="outline"
                      onClick={() => handleDownload(m)}
                      isLoading={downloadingId === m.id}
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
      )}
    </Stack>
  );
}

export default ArtifactsPage;
