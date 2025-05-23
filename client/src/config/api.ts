// API base URL configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wepp3.nkn.uidaho.edu/api';

// API endpoints
export const API_ENDPOINTS = {
  WATERSHEDS: `${API_BASE_URL}/watershed/borders-simplified/`,
  // Add other endpoints as needed
};