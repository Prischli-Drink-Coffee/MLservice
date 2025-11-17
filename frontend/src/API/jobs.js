import client from "./client";

export async function startJob({ datasetId, fileId, mode = "TRAINING", type = "TRAIN", targetColumn } = {}) {
  const datasetIdentifier = datasetId ?? fileId;
  const payload = {
    dataset_id: datasetIdentifier,
    file_id: fileId ?? datasetIdentifier,
    target_column: targetColumn?.trim() || undefined,
    mode,
    type,
  };
  const res = await client.post("/api/jobs/v1/start", payload);
  return res.data;
}

export async function fetchJobResult(jobId) {
  const res = await client.get(`/api/jobs/v1/result/${jobId}`);
  return res.data;
}
