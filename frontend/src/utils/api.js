/**
 * Centralized API Utility for CivicSeva
 * Handles base URL, auth headers, error interception, and retries.
 */

import { API_URL, STORAGE_KEYS } from '../config/constants';

class ApiError extends Error {
  constructor(message, status, data, endpoint) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.endpoint = endpoint;
    this.timestamp = new Date().toISOString();
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const request = async (endpoint, options = {}, retries = 2) => {
  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
  const token = user?.token;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  // If it's FormData, don't set Content-Type header (browser will set it with boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  try {
    // Proactive offline check
    if (!navigator.onLine && !endpoint.includes('/auth')) {
       throw new ApiError('You appear to be offline. Please check your internet connection.', 'OFFLINE', null, endpoint);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    
    // Auto-logout on 401, unless it's a login/register attempt
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('AUTH_EXPIRATION_TRIGGERED:', {
        endpoint,
        status: 401,
        message: errorData.message || 'Unauthorized',
        code: errorData.code || 'NO_CODE',
        hasToken: !!token,
        timestamp: new Date().toISOString()
      });

      // Clear session and redirect
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      // Prevent multiple redirects if many requests fail at once
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        throw new ApiError('Too many requests. Please slow down.', 429, data, endpoint);
      }
      throw new ApiError(data.message || `Error ${response.status}: Something went wrong`, response.status, data, endpoint);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // If it's already an ApiError we threw (like OFFLINE), just pass it up
    if (error instanceof ApiError && error.status === 'OFFLINE') {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. The server is taking too long to respond.', 408, null, endpoint);
    }

    const isNetworkError = error.name === 'TypeError' || error.status === 'NETWORK_ERROR';

    // Log the failure
    console.error(`API Failure: ${endpoint}`, {
      status: error.status || 'UNKNOWN',
      message: error.message,
      retriesLeft: retries
    });

    if (retries > 0 && (isNetworkError || (error.status >= 500 && error.status !== 501))) {
      const baseDelay = 1000;
      const attempt = 3 - retries;
      const delay = baseDelay * Math.pow(2, attempt);
      
      console.warn(`Retrying request to ${endpoint}... (${retries} retries left, waiting ${delay}ms)`);
      await wait(delay);
      return request(endpoint, options, retries - 1);
    }

    // Wrap generic errors in ApiError for consistency
    if (!(error instanceof ApiError)) {
      const message = error.message?.toLowerCase().includes('failed to fetch') 
        ? 'Failed to connect to server' 
        : (error.message || 'A network error occurred');
      throw new ApiError(message, 'NETWORK_ERROR', null, endpoint);
    }
    
    throw error;
  }
};

export const api = {
  get: (url, options) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options) => request(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, options) => request(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body, options) => request(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
  upload: (url, formData, options) => request(url, { ...options, method: 'POST', body: formData }),
};
