import client from "./client";

export async function listGraphs({ page = 1, size = 20, activeOnly = false } = {}) {
  const response = await client.get("/api/graphs/v1/", {
    params: {
      page,
      size,
      active_only: activeOnly,
    },
  });
  return response.data;
}

export async function getGraph(graphId) {
  const response = await client.get(`/api/graphs/v1/${graphId}`);
  return response.data;
}

export async function createGraph(payload) {
  const response = await client.post("/api/graphs/v1/", payload);
  return response.data;
}

export async function updateGraph(graphId, payload) {
  const response = await client.put(`/api/graphs/v1/${graphId}`, payload);
  return response.data;
}

export async function deleteGraph(graphId) {
  await client.delete(`/api/graphs/v1/${graphId}`);
}

export async function executeGraph(graphId, payload) {
  const response = await client.post(`/api/graphs/v1/${graphId}/execute`, payload);
  return response.data;
}

export async function listExecutions(graphId, { limit = 20 } = {}) {
  const response = await client.get(`/api/graphs/v1/${graphId}/executions`, {
    params: {
      limit,
    },
  });
  return response.data;
}

export async function getExecution(executionId) {
  const response = await client.get(`/api/graphs/v1/executions/${executionId}`);
  return response.data;
}

export async function getNodeRegistry() {
  const response = await client.get("/api/graphs/v1/nodes/registry");
  return response.data;
}
