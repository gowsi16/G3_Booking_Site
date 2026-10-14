/**
 * Application Configuration
 * Provides centralized URLs and environment variables for G3 Booking Site
 */

export const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:3000';
export const BOOKING_API_BASE_URL = import.meta.env.VITE_BOOKING_API_URL || 'http://localhost:5000/api';
