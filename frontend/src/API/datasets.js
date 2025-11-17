import client from "./client";

export async function listDatasets({ limit = 20 } = {}) {
  const res = await client.get("/api/ml/v1/datasets", { params: { limit } });
  return res.data;
}

export async function uploadDataset(file, { mode = "TRAINING" } = {}) {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post(`/api/ml/v1/datasets/upload`, form, {
    params: { mode },
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function cleanupExpiredDatasets({ limit = 1000 } = {}) {
  const res = await client.delete("/api/ml/v1/datasets/expired", { params: { limit } });
  return res.data;
}

export async function deleteDataset(datasetId) {
  const res = await client.delete(`/api/ml/v1/datasets/${datasetId}`);
  return res.data;
}
