import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { deleteArtifact, getArtifactDownloadUrl, listArtifacts } from "@api";
import { showErrorToast } from "@utils/errorHandler";
import isAbortError from "@utils/isAbortError";

const defaultOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || defaultOrigin || "";

const toAbsoluteApiUrl = (url) => {
  if (!url) return url;
  try {
    return new URL(url).toString();
  } catch (error) {
    try {
      return new URL(url, apiBaseUrl || defaultOrigin || "").toString();
    } catch (err) {
      return url;
    }
  }
};

export default function useArtifactsPageController() {
  const toast = useToast();
  const [artifacts, setArtifacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [artifactToDelete, setArtifactToDelete] = useState(null);
  const [error, setError] = useState(null);

  const loadAbortRef = useRef(null);
  const downloadAbortRef = useRef(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      loadAbortRef.current?.abort();
      downloadAbortRef.current?.abort();
    };
  }, []);

  const loadArtifacts = useCallback(async () => {
    if (loadAbortRef.current) {
      loadAbortRef.current.abort();
    }
    const controller = new AbortController();
    loadAbortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await listArtifacts({ limit: 50, signal: controller.signal });
      if (!isMountedRef.current || controller.signal.aborted) {
        return null;
      }
      setArtifacts(data);
      return data;
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted) {
        return null;
      }
      setError("Не удалось загрузить артефакты");
      showErrorToast(toast, err, {
        title: "Ошибка",
        fallbackMessage: "Не удалось загрузить артефакты",
      });
      return null;
    } finally {
      if (!isMountedRef.current || controller.signal.aborted) {
        return;
      }
      if (loadAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    loadArtifacts().catch(() => {});
  }, [loadArtifacts]);

  const filteredArtifacts = useMemo(() => {
    if (!searchQuery.trim()) return artifacts;
    const query = searchQuery.toLowerCase();
    return artifacts.filter((item) => {
      const dateStr = new Date(item.created_at).toLocaleString().toLowerCase();
      const urlStr = item.model_url?.toLowerCase?.() || "";
      const metricsStr = JSON.stringify(item.metrics || {}).toLowerCase();
      return (
        dateStr.includes(query) ||
        urlStr.includes(query) ||
        metricsStr.includes(query) ||
        item.id.toString().includes(query)
      );
    });
  }, [artifacts, searchQuery]);

  const requestDelete = useCallback((artifact) => {
    setArtifactToDelete(artifact);
  }, []);

  const cancelDelete = useCallback(() => {
    setArtifactToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!artifactToDelete) return;

    setDeletingId(artifactToDelete.id);
    try {
      await deleteArtifact(artifactToDelete.id);
      toast({ title: "Артефакт удалён", status: "success" });
      await loadArtifacts();
    } catch (err) {
      showErrorToast(toast, err, {
        title: "Не удалось удалить",
        fallbackMessage: "Удаление артефакта завершилось ошибкой",
      });
    } finally {
      setDeletingId(null);
      setArtifactToDelete(null);
    }
  }, [artifactToDelete, loadArtifacts, toast]);

  const handleDownload = useCallback(
    async (artifact) => {
      if (!artifact) return null;
      if (downloadAbortRef.current) {
        downloadAbortRef.current.abort();
      }
      const controller = new AbortController();
      downloadAbortRef.current = controller;
      setDownloadingId(artifact.id);
      try {
        const { url } = await getArtifactDownloadUrl(artifact.id, { signal: controller.signal });
        if (!isMountedRef.current || controller.signal.aborted) {
          return null;
        }
        if (!url) throw new Error("Не удалось получить ссылку на файл");
        if (typeof window !== "undefined") {
          window.open(toAbsoluteApiUrl(url), "_blank", "noopener,noreferrer");
        }
        return url;
      } catch (err) {
        if (!(isAbortError(err) || controller.signal.aborted)) {
          showErrorToast(toast, err, {
            title: "Не удалось скачать",
            fallbackMessage: "Не удалось получить ссылку на артефакт",
          });
        }
        return null;
      } finally {
        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }
        if (downloadAbortRef.current === controller) {
          setDownloadingId(null);
        }
      }
    },
    [toast],
  );

  const isInitialLoading = loading && !artifacts.length;

  return {
    artifacts,
    filteredArtifacts,
    searchQuery,
    setSearchQuery,
    loading,
    isInitialLoading,
    downloadingId,
    deletingId,
    error,
    setError,
    loadArtifacts,
    requestDelete,
    confirmDelete,
    cancelDelete,
    artifactToDelete,
    handleDownload,
  };
}
