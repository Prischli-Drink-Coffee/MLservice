import client from "./client";

export async function getPlatformStats() {
  const response = await client.get("/api/stats/v1/platform");
  return response.data;
}
