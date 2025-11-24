import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { deleteDataset, getFileDownloadUrl, listDatasets, uploadDataset } from "@api";
import extractErrorInfo, { showErrorToast } from "@utils/errorHandler";
import { useAuth } from "@context/AuthContext";
import isAbortError from "@utils/isAbortError";

const defaultOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || defaultOrigin || "";
const DATASET_REMOVED_CODE = "DATASET_REMOVED";

const toAbsoluteApiUrl = (url) => {
  if (!url) return url;
  try {
    return new URL(url, apiBaseUrl || defaultOrigin || "").toString();
  } catch (error) {
    return url;
  }
};

export default function useDatasetsPageController() {
  const toast = useToast();
  const { user } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [datasetToDelete, setDatasetToDelete] = useState(null);
  const [error, setError] = useState(null);

  const datasetsAbortRef = useRef(null);
  const uploadAbortRef = useRef(null);
  const downloadAbortRef = useRef(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      datasetsAbortRef.current?.abort();
      uploadAbortRef.current?.abort();
      downloadAbortRef.current?.abort();
    };
  }, []);

  const canCleanupDatasets = useMemo(() => {
    const permissions = user?.permissions || [];
    return Array.isArray(permissions) && permissions.includes("datasets:cleanup");
  }, [user]);

  const loadDatasets = useCallback(async () => {
    if (datasetsAbortRef.current) {
      datasetsAbortRef.current.abort();
    }
    const controller = new AbortController();
    datasetsAbortRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listDatasets({ limit: 50, signal: controller.signal });
      if (!isMountedRef.current || controller.signal.aborted) {
        return null;
      }
      setDatasets(data);
      return data;
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted) {
        return null;
      }
      const { userMessage } = extractErrorInfo(err, { fallbackMessage: "Не удалось загрузить датасеты" });
      setError(userMessage);
      return null;
    } finally {
      if (!isMountedRef.current) {
        return;
      }
      if (datasetsAbortRef.current === controller) {
        setIsLoading(false);
        datasetsAbortRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    loadDatasets().catch(() => {});
  }, [loadDatasets]);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort();
    }
    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setIsUploading(true);
    try {
      const response = await uploadDataset(file, { signal: controller.signal });
      if (!isMountedRef.current || controller.signal.aborted) {
        return null;
      }
      toast({ title: "Датасет загружен", description: `Версия v${response.version}`, status: "success" });
      setFile(null);
      await loadDatasets();
      return response;
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted) {
        return null;
      }
      showErrorToast(toast, err, {
        title: "Ошибка загрузки",
        fallbackMessage: "Не удалось загрузить датасет",
      });
      return null;
    } finally {
      if (!isMountedRef.current) {
        return;
      }
      if (uploadAbortRef.current === controller) {
        setIsUploading(false);
        uploadAbortRef.current = null;
      }
    }
  }, [file, loadDatasets, toast]);

  const handleDownload = useCallback(
    async (dataset) => {
      if (!dataset) return;
      if (downloadAbortRef.current) {
        downloadAbortRef.current.abort();
      }
      const controller = new AbortController();
      downloadAbortRef.current = controller;
      setDownloadingId(dataset.id);
      try {
        const { url } = await getFileDownloadUrl(dataset.id, { signal: controller.signal });
        if (!isMountedRef.current || controller.signal.aborted) {
          return null;
        }
        if (typeof window !== "undefined") {
          window.open(toAbsoluteApiUrl(url), "_blank", "noopener,noreferrer");
        }
        toast({
          title: "Скачивание началось",
          description: `Загружается ${dataset.name}`,
          status: "success",
          duration: 3000,
        });
        return url;
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) {
          return null;
        }
        const info = extractErrorInfo(err, { fallbackMessage: "Не удалось получить ссылку для скачивания" });
        if (info.code === DATASET_REMOVED_CODE) {
          toast({
            title: "Датасет удалён",
            description: info.userMessage,
            status: "warning",
            duration: 5000,
          });
          await loadDatasets();
        } else {
          toast({
            title: "Ошибка скачивания",
            description: info.userMessage,
            status: "error",
            duration: 5000,
          });
        }
        return null;
      } finally {
        if (!isMountedRef.current) {
          return;
        }
        if (downloadAbortRef.current === controller) {
          setDownloadingId(null);
          downloadAbortRef.current = null;
        }
      }
    },
    [loadDatasets, toast],
  );

  const requestDelete = useCallback((dataset) => {
    setDatasetToDelete(dataset);
  }, []);

  const cancelDelete = useCallback(() => {
    setDatasetToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!datasetToDelete) return;

    setDeletingId(datasetToDelete.id);
    try {
      await deleteDataset(datasetToDelete.id);
      toast({
        title: "Датасет удалён",
        description: `${datasetToDelete.name} удалён безвозвратно`,
        status: "success",
        duration: 3000,
      });
      await loadDatasets();
    } catch (err) {
      showErrorToast(toast, err, {
        title: "Ошибка удаления",
        fallbackMessage: "Не удалось удалить датасет",
        duration: 5000,
      });
    } finally {
      setDeletingId(null);
      setDatasetToDelete(null);
    }
  }, [datasetToDelete, loadDatasets, toast]);

  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) return datasets;
    const query = searchQuery.toLowerCase();
    return datasets.filter(
      (dataset) =>
        dataset.name.toLowerCase().includes(query) ||
        `v${dataset.version}`.includes(query) ||
        dataset.id.toString().includes(query),
    );
  }, [datasets, searchQuery]);

  const csvGuidelines = useMemo(
    () => [
      "Формат файла — .csv c минимум двумя колонками и заголовками",
      "Пустые строки и столбцы будут отброшены автоматически",
      "Доля пропусков ограничена настройкой MAX_EMPTY_RATIO",
      "MAX_CSV_UPLOAD_BYTES задаёт максимальный размер файла (ошибка 413)",
    ],
    [],
  );

  const isInitialLoading = isLoading && datasets.length === 0;

  return {
    datasets,
    filteredDatasets,
    loadDatasets,
    file,
    setFile,
    searchQuery,
    setSearchQuery,
    isUploading,
    isLoading,
    isInitialLoading,
    downloadingId,
    deletingId,
    error,
    setError,
    handleUpload,
    handleDownload,
    requestDelete,
    confirmDelete,
    cancelDelete,
    datasetToDelete,
    csvGuidelines,
    canCleanupDatasets,
  };
}
