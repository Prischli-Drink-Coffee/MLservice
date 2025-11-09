import React, { useEffect, useState, useMemo } from "react";
import { Stack, useToast, Button, HStack, Input, Text, SimpleGrid, Box } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import { listDatasets, uploadDataset } from "../API";
import { ErrorAlert, LoadingState, EmptyState } from "../components";
import TTLCleanupCard from "../components/common/TTLCleanupCard";
import GlowingInput from "../components/common/GlowingInput";

function DatasetsPage() {
  const toast = useToast();
  const [datasets, setDatasets] = useState([]);
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  // Фильтруем датасеты по поисковому запросу
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

  const body = () => {
    if (isLoading && datasets.length === 0) return <LoadingState label="Загружаем датасеты" />;
    if (error) return <ErrorAlert description={error} onClose={() => setError(null)} />;
    if (datasets.length === 0) return <EmptyState title="Нет датасетов" description="Загрузите CSV файл, чтобы начать обучение" />;

    if (filteredDatasets.length === 0) {
      return <EmptyState title="Ничего не найдено" description={`По запросу "${searchQuery}" датасеты не найдены`} />;
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {filteredDatasets.map((ds) => (
          <Card key={ds.id} p={4}>
            <Stack spacing={2}>
              <Text fontWeight="semibold">Версия v{ds.version}</Text>
              <Text fontSize="sm" color="text.muted">{new Date(ds.created_at).toLocaleString()}</Text>
              <Text fontSize="sm" wordBreak="break-all">{ds.name}</Text>
              {ds.download_url && (
                <Button as="a" href={ds.download_url} size="sm" target="_blank" rel="noopener noreferrer" variant="outline">Скачать</Button>
              )}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Stack spacing={6}>
      <PageHeader
        title="Датасеты"
        subtitle="Загружайте CSV файлы для обучения моделей"
        actions={
          <HStack>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              size="sm"
            />
            <Button onClick={handleUpload} isLoading={isUploading} colorScheme="brand" size="sm" disabled={!file}>Загрузить</Button>
            <Button variant="ghost" size="sm" onClick={fetchDatasets}>Обновить</Button>
          </HStack>
        }
      />

      {isAdminUI && <TTLCleanupCard isAdmin />}

      {/* Поиск датасетов */}
      {datasets.length > 0 && (
        <Box maxW="600px">
          <GlowingInput
            placeholder="Поиск по названию, версии или ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            showSubmitButton={false}
            leftIcon={SearchIcon}
          />
        </Box>
      )}

      <Card p={4}>
        <Stack spacing={2} fontSize="sm" color="text.muted">
          <Text>Требования к CSV:</Text>
          <Text>• Расширение .csv; минимум 2 колонки</Text>
          <Text>• Заголовок обязателен, не пустой файл</Text>
          <Text>• Допустимая доля пустых значений ограничена (MAX_EMPTY_RATIO)</Text>
          <Text>• Лимит размера (MAX_CSV_UPLOAD_BYTES), при превышении будет ошибка 413</Text>
        </Stack>
      </Card>
      {body()}
    </Stack>
  );
}

export default DatasetsPage;
