import { useCallback, useEffect, useMemo, useState } from "react";
import { getMetricsSummary, listDatasets } from "../../API";
import extractErrorInfo from "../../utils/errorHandler";

const DEFAULT_LIMIT = 50;

export default function useMetricsPageController() {
  const [datasets, setDatasets] = useState([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [datasetsError, setDatasetsError] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [targetColumn, setTargetColumn] = useState("");

  const [metricsData, setMetricsData] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);

  const loadDatasets = useCallback(async () => {
    setDatasetsLoading(true);
    setDatasetsError(null);
    try {
      const result = await listDatasets({ limit: DEFAULT_LIMIT });
      setDatasets(result);
      setSelectedDatasetId((prev) => prev || result[0]?.id || "");
      return result;
    } catch (error) {
      const { userMessage } = extractErrorInfo(error, { fallbackMessage: "Не удалось загрузить датасеты" });
      setDatasetsError(userMessage);
      throw error;
    } finally {
      setDatasetsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets().catch(() => {});
  }, [loadDatasets]);

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) || null,
    [datasets, selectedDatasetId],
  );

  const targetOptions = useMemo(() => {
    const metaColumns = selectedDataset?.meta?.columns;
    if (Array.isArray(metaColumns) && metaColumns.length) {
      return metaColumns;
    }
    const legacyColumns = selectedDataset?.columns;
    return Array.isArray(legacyColumns) ? legacyColumns : [];
  }, [selectedDataset]);

  useEffect(() => {
    if (!targetOptions.length) {
      setTargetColumn("");
      return;
    }
    setTargetColumn((prev) => (prev && targetOptions.includes(prev) ? prev : targetOptions[targetOptions.length - 1]));
  }, [targetOptions]);

  const loadMetrics = useCallback(async () => {
    if (!selectedDatasetId || !targetColumn) {
      setMetricsData(null);
      return;
    }
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const response = await getMetricsSummary({
        limit: DEFAULT_LIMIT,
        datasetId: selectedDatasetId,
        targetColumn,
      });
      setMetricsData(response);
    } catch (error) {
      const { userMessage } = extractErrorInfo(error, { fallbackMessage: "Не удалось загрузить метрики" });
      setMetricsError(userMessage);
      setMetricsData(null);
      throw error;
    } finally {
      setMetricsLoading(false);
    }
  }, [selectedDatasetId, targetColumn]);

  useEffect(() => {
    if (!selectedDatasetId || !targetColumn) return;
    loadMetrics().catch(() => {});
  }, [selectedDatasetId, targetColumn, loadMetrics]);

  const aggregates = metricsData?.aggregates || {};
  const trends = useMemo(() => metricsData?.trends || [], [metricsData]);

  const { clsPoints, regPoints } = useMemo(() => {
    const cls = [];
    const reg = [];
    trends.forEach((t) => {
      const ts = new Date(t.created_at).toLocaleString();
      if (t.metrics?.task === "classification") {
        cls.push({
          ts,
          version: t.version,
          accuracy: t.metrics.accuracy ?? null,
        });
      } else if (t.metrics?.task === "regression") {
        reg.push({
          ts,
          version: t.version,
          r2: t.metrics.r2 ?? null,
          mse: t.metrics.mse ?? null,
        });
      }
    });
    return { clsPoints: cls, regPoints: reg };
  }, [trends]);

  const cannotSelectTarget = Boolean(selectedDataset) && !targetOptions.length && !datasetsLoading;
  const isInitialLoading = metricsLoading && !metricsData;

  return {
    datasets,
    datasetsLoading,
    datasetsError,
    selectedDataset,
    selectedDatasetId,
    setSelectedDatasetId,
    targetColumn,
    setTargetColumn,
    targetOptions,
    loadDatasets,
    loadMetrics,
    metricsData,
    metricsLoading,
    metricsError,
    aggregates,
    clsPoints,
    regPoints,
    trends,
    cannotSelectTarget,
    isInitialLoading,
  };
}
