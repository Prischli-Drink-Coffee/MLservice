import client from "./client";

export async function getMetricsTrends({ mode = null, limit = 50, datasetId, targetColumn } = {}) {
  const params = { limit };
  if (mode) params.mode = mode;
  if (datasetId) params.dataset_id = datasetId;
  if (targetColumn) params.target_column = targetColumn;
  const res = await client.get("/api/ml/v1/metrics/trends", { params });
  return res.data;
}

export async function getMetricsSummary({ mode = null, limit = 50, datasetId, targetColumn } = {}) {
  const params = { limit };
  if (mode) params.mode = mode;
  if (datasetId) params.dataset_id = datasetId;
  if (targetColumn) params.target_column = targetColumn;
  const res = await client.get("/api/ml/v1/metrics/summary", { params });
  return res.data;
}
