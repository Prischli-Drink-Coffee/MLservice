import client from "./client";

export async function listBots({ activeOnly = false } = {}) {
  const response = await client.get("/api/graphs/v1/telegram/bots", {
    params: {
      active_only: activeOnly,
    },
  });
  return response.data;
}

export async function createBot(payload) {
  const response = await client.post("/api/graphs/v1/telegram/bots", payload);
  return response.data;
}

export async function updateBot(botId, payload) {
  const response = await client.put(`/api/graphs/v1/telegram/bots/${botId}`, payload);
  return response.data;
}

export async function deleteBot(botId) {
  await client.delete(`/api/graphs/v1/telegram/bots/${botId}`);
}

export async function listBotTriggers(botId, { activeOnly = false } = {}) {
  const response = await client.get(`/api/graphs/v1/telegram/bots/${botId}/triggers`, {
    params: {
      active_only: activeOnly,
    },
  });
  return response.data;
}

export async function createTrigger(payload) {
  const response = await client.post("/api/graphs/v1/telegram/triggers", payload);
  return response.data;
}

export async function updateTrigger(triggerId, payload) {
  const response = await client.put(`/api/graphs/v1/telegram/triggers/${triggerId}`, payload);
  return response.data;
}

export async function deleteTrigger(triggerId) {
  await client.delete(`/api/graphs/v1/telegram/triggers/${triggerId}`);
}

export async function botLifecycle(botId, action) {
  const response = await client.post(`/api/graphs/v1/telegram/bots/${botId}/lifecycle`, { action });
  return response.data;
}

export async function getBotStatus(botId) {
  const response = await client.get(`/api/graphs/v1/telegram/bots/${botId}/status`);
  return response.data;
}

export async function pauseBot(botId) {
  const response = await client.post(`/api/graphs/v1/telegram/bots/${botId}/pause`);
  return response.data;
}

export async function resumeBot(botId) {
  const response = await client.post(`/api/graphs/v1/telegram/bots/${botId}/resume`);
  return response.data;
}

export async function stopBot(botId) {
  const response = await client.post(`/api/graphs/v1/telegram/bots/${botId}/stop`);
  return response.data;
}

export async function getJobStatus(botId) {
  const response = await client.get(`/api/graphs/v1/telegram/bots/${botId}/job-status`);
  return response.data;
}
