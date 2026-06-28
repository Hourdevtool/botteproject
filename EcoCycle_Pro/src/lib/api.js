export const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://127.0.0.1:5000';
  }

  return window.location.origin;
};

export const apiUrl = (path) => new URL(path, `${getApiBaseUrl()}/`).toString();

export const API_BASE_URL = getApiBaseUrl();

export default {
  getApiBaseUrl,
  apiUrl,
  API_BASE_URL,
};
