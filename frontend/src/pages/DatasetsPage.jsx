import { useEffect, useState, useMemo } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import PageHeader from "../components/common/PageHeader";
import { listDatasets, uploadDataset, getFileDownloadUrl, deleteDataset } from "../API";
import { ErrorAlert, LoadingState, EmptyState } from "../components";
import TTLCleanupCard from "../components/common/TTLCleanupCard";
import GlowingCard from "../components/common/GlowingCard";
import DatasetCard from "../components/datasets/DatasetCard";
import DatasetSearchBar from "../components/datasets/DatasetSearchBar";

const defaultOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || defaultOrigin || "";
const DATASET_REMOVED_CODE = "DATASET_REMOVED";

const toAbsoluteApiUrl = (url) => {
  if (!url) return url;
  try {
    return new URL(url, apiBaseUrl || defaultOrigin || "").toString();
  } catch (e) {
    return url;
  }
};

function DatasetsPage() {
  const toast = useToast();
  const [datasets, setDatasets] = useState([]);
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const isAdminUI = String(process.env.REACT_APP_ENABLE_ADMIN_UI || "false").toLowerCase() === "true";

  const fetchDatasets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listDatasets({ limit: 50 });
      setDatasets(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const resp = await uploadDataset(file);
      toast({ title: "Датасет загружен", description: `Версия v${resp.version}`, status: "success" });
      setFile(null);
      await fetchDatasets();
    } catch (e) {
      const status = e.response?.status;
      const detail = e.response?.data?.detail || e.message;
      let msg = detail;
      if (status === 413) msg = "Файл слишком большой. Проверьте лимит размера.";
      toast({ title: "Ошибка загрузки", description: msg, status: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (dataset) => {
    setDownloadingId(dataset.id);
    try {
      const { url } = await getFileDownloadUrl(dataset.id);
      window.open(toAbsoluteApiUrl(url), '_blank');

      toast({
        title: 'Скачивание началось',
        description: `Загружается ${dataset.name}`,
        status: 'success',
        duration: 3000,
      });
    } catch (e) {
      const detail = e.response?.data?.detail;
      const code = typeof detail === 'string' ? detail : detail?.code;
      const message = typeof detail === 'string' ? detail : detail?.message;

      if (code === DATASET_REMOVED_CODE) {
        toast({
          title: 'Датасет удалён',
          description: message || 'Файл недоступен, запись очищена',
          status: 'warning',
          duration: 5000,
        });
        await fetchDatasets();
        return;
      }

      toast({
        title: 'Ошибка скачивания',
        description: message || 'Не удалось получить ссылку для скачивания',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (dataset) => {
    const confirmed = window.confirm(`Удалить датасет "${dataset.name}"? Это действие необратимо.`);
    if (!confirmed) return;

    setDeletingId(dataset.id);
    try {
      await deleteDataset(dataset.id);
      toast({
        title: 'Датасет удалён',
        description: `${dataset.name} удалён безвозвратно`,
        status: 'success',
        duration: 3000,
      });
      await fetchDatasets();
    } catch (e) {
      const message = e.response?.data?.detail || e.message || 'Не удалось удалить датасет';
      toast({
        title: 'Ошибка удаления',
        description: message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) return datasets;
    const query = searchQuery.toLowerCase();
    return datasets.filter(
      (ds) =>
        ds.name.toLowerCase().includes(query) ||
        `v${ds.version}`.includes(query) ||
        ds.id.toString().includes(query)
    );
  }, [datasets, searchQuery]);

  const renderDatasets = () => {
    if (isLoading && datasets.length === 0) {
      return (
        <GlowingCard intensity="subtle">
          <LoadingState label="Загружаем датасеты" />
        </GlowingCard>
      );
    }

    if (error) {
      return (
        <GlowingCard intensity="subtle">
          <ErrorAlert description={error} onClose={() => setError(null)} />
        </GlowingCard>
      );
    }

    if (datasets.length === 0) {
      return (
        <GlowingCard intensity="subtle">
          <EmptyState title="Нет датасетов" description="Загрузите CSV файл, чтобы начать обучение" />
        </GlowingCard>
      );
    }

    if (filteredDatasets.length === 0) {
      return (
        <GlowingCard intensity="subtle">
          <EmptyState title="Ничего не найдено" description={`По запросу "${searchQuery}" датасеты не найдены`} />
        </GlowingCard>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={{ base: 4, md: 6 }} w="full">
        {filteredDatasets.map((ds) => (
          <DatasetCard
            key={ds.id}
            dataset={ds}
            onDownload={handleDownload}
            onDelete={handleDelete}
            isDownloading={downloadingId === ds.id}
            isDeleting={deletingId === ds.id}
          />
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Stack spacing={6} w="full">
      <PageHeader
        title="Датасеты"
        subtitle="Загружайте CSV файлы для обучения моделей"
        actions={
          <HStack spacing={3} align="center">
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              size="sm"
              maxW="260px"
            />
            <Button
              onClick={handleUpload}
              isLoading={isUploading}
              colorScheme="brand"
              size="sm"
              isDisabled={!file}
            >
              Загрузить
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchDatasets}>
              Обновить
            </Button>
          </HStack>
        }
      />

      {isAdminUI && (
        <GlowingCard intensity="subtle">
          <TTLCleanupCard isAdmin />
        </GlowingCard>
      )}

      <DatasetSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery("")}
        totalCount={datasets.length}
        filteredCount={filteredDatasets.length}
        placeholder="Поиск по названию, версии или ID..."
      />

      <GlowingCard intensity="subtle">
        <Stack spacing={3} fontSize="sm" color="text.muted">
          <Text fontWeight={600} fontSize="md" color="text.primary">
            Требования к CSV
          </Text>
          <Text>• Файл в формате .csv, минимум две колонки с заголовками</Text>
          <Text>• Заголовок обязателен, пустые строки и столбцы будут отброшены</Text>
          <Text>• Доля пустых значений ограничена настройкой MAX_EMPTY_RATIO</Text>
          <Text>• Размер файла не должен превышать MAX_CSV_UPLOAD_BYTES (ошибка 413)</Text>
        </Stack>
      </GlowingCard>
      {renderDatasets()}
    </Stack>
  );
}

export default DatasetsPage;
