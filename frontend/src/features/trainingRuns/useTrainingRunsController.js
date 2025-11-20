import { useToast } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listDatasets, listTrainingRuns, startJob, fetchJobResult } from "../../API";
import extractErrorInfo from "../../utils/errorHandler";
import isAbortError from "../../utils/isAbortError";
import { formatDateTime } from "./utils";

const getNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const createAbortableDelay = (ms = 0, signal) =>
  new Promise((resolve, reject) => {
    if (ms <= 0) {
      resolve();
      return;
    }

    let timeoutId = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    const onAbort = () => {
      cleanup();
      const abortError = new Error("Delay aborted");
      abortError.name = "AbortError";
      reject(abortError);
    };

    timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    if (signal) {
      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener("abort", onAbort, { once: true });
      }
    }
  });

export default function useTrainingRunsController() {
  const toast = useToast();

  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [datasetsError, setDatasetsError] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [targetColumn, setTargetColumn] = useState("");

  const [launchingPreset, setLaunchingPreset] = useState(null);
  const [jobInfo, setJobInfo] = useState(null);
  const [jobError, setJobError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const runsAbortRef = useRef(null);
  const datasetsAbortRef = useRef(null);
  const pollAbortRef = useRef(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      runsAbortRef.current?.abort();
      datasetsAbortRef.current?.abort();
      pollAbortRef.current?.abort();
    };
  }, []);

  const loadRuns = useCallback(async () => {
    if (runsAbortRef.current) {
      runsAbortRef.current.abort();
    }
    const controller = new AbortController();
    runsAbortRef.current = controller;
    setRunsLoading(true);
    setRunsError(null);
    try {
      const data = await listTrainingRuns({ limit: 50, signal: controller.signal });
      if (!isMountedRef.current || controller.signal.aborted) {
        return null;
      }
      setRuns(data);
      return data;
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) {
        return null;
      }
      const { userMessage } = extractErrorInfo(error, { fallbackMessage: "Не удалось загрузить запуски" });
      setRunsError(userMessage);
      return null;
    } finally {
      if (!isMountedRef.current) {
        return;
      }
      if (runsAbortRef.current === controller) {
        setRunsLoading(false);
        runsAbortRef.current = null;
      }
    }
  }, []);

  const loadDatasets = useCallback(async () => {
    if (datasetsAbortRef.current) {
      datasetsAbortRef.current.abort();
    }
    const controller = new AbortController();
    datasetsAbortRef.current = controller;
    setDatasetsLoading(true);
    setDatasetsError(null);
    try {
      const data = await listDatasets({ limit: 50, signal: controller.signal });
      if (!isMountedRef.current || controller.signal.aborted) {
        return null;
      }
      setDatasets(data);
      setSelectedDatasetId((prev) => prev || data[0]?.id || "");
      return data;
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) {
        return null;
      }
      const { userMessage } = extractErrorInfo(error, { fallbackMessage: "Не удалось загрузить датасеты" });
      setDatasetsError(userMessage);
      return null;
    } finally {
      if (!isMountedRef.current) {
        return;
      }
      if (datasetsAbortRef.current === controller) {
        setDatasetsLoading(false);
        datasetsAbortRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  useEffect(() => {
    const dataset = datasets.find((item) => item.id === selectedDatasetId) || null;
    const columns = (dataset?.columns || dataset?.meta?.columns || []).slice?.() || [];
    if (columns.length > 0) {
      setTargetColumn((prev) => prev || columns[columns.length - 1] || columns[0]);
    } else {
      setTargetColumn("");
    }
  }, [selectedDatasetId, datasets]);

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) || null,
    [datasets, selectedDatasetId],
  );

  const pollJobResult = useCallback(
    async (jobId) => {
      if (!jobId) return null;

      if (pollAbortRef.current) {
        pollAbortRef.current.abort();
      }

      const controller = new AbortController();
      pollAbortRef.current = controller;
      setIsPolling(true);

      const maxAttempts = 8;
      const baseDelay = 1400;
      const delayStep = 300;

      try {
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          const startedAt = getNow();
          const latest = await fetchJobResult(jobId, { signal: controller.signal });

          if (!isMountedRef.current || controller.signal.aborted) {
            return null;
          }

          setJobInfo(latest);

          if (["SUCCESS", "FAILURE"].includes(latest.status)) {
            const isSuccess = latest.status === "SUCCESS";
            toast({
              title: isSuccess ? "Обучение завершено" : "Обучение завершилось ошибкой",
              status: isSuccess ? "success" : "error",
            });
            await loadRuns();
            return latest;
          }

          const elapsed = getNow() - startedAt;
          const plannedDelay = baseDelay + attempt * delayStep;
          const remaining = Math.max(0, plannedDelay - elapsed);

          if (remaining > 0) {
            try {
              await createAbortableDelay(remaining, controller.signal);
            } catch (delayError) {
              if (isAbortError(delayError) || controller.signal.aborted) {
                return null;
              }
              throw delayError;
            }
          }
        }

        toast({ title: "Статус обновлён", description: "Обучение ещё в процессе", status: "info" });
        return null;
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) {
          return null;
        }
        const { userMessage } = extractErrorInfo(error, { fallbackMessage: "Не удалось получить статус" });
        setJobError(userMessage);
        toast({ title: "Ошибка статуса", description: userMessage, status: "error" });
        return null;
      } finally {
        if (pollAbortRef.current === controller) {
          setIsPolling(false);
          pollAbortRef.current = null;
        }
      }
    },
    [loadRuns, toast],
  );

  const handleStartJob = useCallback(async () => {
    if (!selectedDatasetId) {
      toast({ title: "Выберите датасет", description: "Нельзя запустить обучение без датасета", status: "warning" });
      return;
    }
    setLaunchingPreset("standard");
    setJobError(null);
    try {
      const response = await startJob({ datasetId: selectedDatasetId, targetColumn, mode: "TRAINING", type: "TRAIN" });
      setJobInfo(response);
      toast({
        title: "Обучение запущено",
        description: `ID задачи: ${response.job_id}`,
        status: "success",
      });
      const pollPromise = pollJobResult(response.job_id);
      if (pollPromise?.catch) {
        pollPromise.catch(() => {});
      }
    } catch (error) {
      const { userMessage } = extractErrorInfo(error, { fallbackMessage: "Не удалось запустить обучение" });
      setJobError(userMessage);
      toast({ title: "Ошибка запуска", description: userMessage, status: "error" });
    } finally {
      setLaunchingPreset(null);
    }
  }, [selectedDatasetId, targetColumn, pollJobResult, toast]);

  const handleRefreshStatus = useCallback(async () => {
    if (!jobInfo?.job_id) {
      toast({ title: "Нет активной задачи", description: "Сначала запустите обучение", status: "info" });
      return;
    }
    setJobError(null);
    await pollJobResult(jobInfo.job_id);
  }, [jobInfo, pollJobResult, toast]);

  const filteredRuns = useMemo(() => {
    if (!searchQuery.trim()) return runs;
    const query = searchQuery.toLowerCase();
    return runs.filter((run) => {
      const dateStr = formatDateTime(run.created_at).toLowerCase();
      const metricsStr = JSON.stringify(run.metrics || {}).toLowerCase();
      return dateStr.includes(query) || metricsStr.includes(query) || run.id.toString().includes(query);
    });
  }, [runs, searchQuery]);

  return {
    runs,
    runsLoading,
    runsError,
    filteredRuns,
    searchQuery,
    setSearchQuery,
    dismissRunsError: () => setRunsError(null),
    datasets,
    datasetsLoading,
    datasetsError,
    dismissDatasetsError: () => setDatasetsError(null),
    selectedDatasetId,
    setSelectedDatasetId,
    selectedDataset,
    targetColumn,
    setTargetColumn,
    refreshDatasets: loadDatasets,
    jobInfo,
    jobError,
    dismissJobError: () => setJobError(null),
    launchingPreset,
    isPolling,
    loadRuns,
    handleStartJob,
    handleRefreshStatus,
  };
}
