import client from "./client";

export async function listArtifacts({ limit = 20 } = {}) {
  const res = await client.get("/api/ml/v1/artifacts", { params: { limit } });
  return res.data;
}

export async function deleteArtifact(artifactId) {
  const res = await client.delete(`/api/ml/v1/artifacts/${artifactId}`);
  return res.data;
}
