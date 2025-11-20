import client from "./client";

export async function listTrainingRuns({ limit = 20, signal } = {}) {
  const res = await client.get("/api/ml/v1/training-runs", { params: { limit }, signal });
  return res.data;
}
