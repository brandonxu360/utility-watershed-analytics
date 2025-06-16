// API base URL configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wepp3.nkn.uidaho.edu/api';

// API endpoints
export const API_ENDPOINTS = {
  // List all watersheds
  WATERSHEDS: `${API_BASE_URL}/watershed/`,
  // Get a single watershed or post-list by id
  WATERSHED:  (id: string) => `${API_BASE_URL}/watershed/${id}/`,
  // Subcatchments for a watershed
  SUBCATCHMENTS: (id: string) => `${API_BASE_URL}/watershed/${id}/subcatchments`,
  // Channels for a watershed
  CHANNELS: (id: string) => `${API_BASE_URL}/watershed/${id}/channels`,
};