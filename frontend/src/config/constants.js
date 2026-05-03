/**
 * Centralized configuration constants for CivicSeva.
 * All environment-dependent values should live here.
 */

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/**
 * Generates a full URL for server-hosted assets (e.g. uploaded photos).
 * @param {string} path — The relative path from the server root (e.g. "/uploads/photo.jpg")
 * @returns {string|null} The full URL, or null if path is falsy.
 */
export const getAssetUrl = (path) => {
  if (!path) return null;
  // If the path is already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
};

export const STORAGE_KEYS = {
  TOKEN: 'civicseva_token',
  USER: 'civicseva-user',
  QUEUE: 'offline_complaints_queue',
};
