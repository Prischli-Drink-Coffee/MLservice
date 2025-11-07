import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "/";

let unauthorizedHandler = null;

// Публичные эндпоинты, для которых не требуется авторизация
const PUBLIC_ENDPOINTS = ["/api/health"];

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Проверяем, является ли запрос публичным эндпоинтом
      const requestUrl = error.config?.url || "";
      const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint));

      // Вызываем unauthorizedHandler только для защищённых эндпоинтов
      if (!isPublicEndpoint && typeof unauthorizedHandler === "function") {
        unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  },
);

export default client;
