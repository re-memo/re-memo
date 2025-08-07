/**
 * Environment configuration
 */
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 're:memo',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },
  features: {
    enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
};

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key, fallback = '') {
  return import.meta.env[key] || fallback;
}

/**
 * Check if we're in development mode
 */
export function isDev() {
  return config.app.isDevelopment;
}

/**
 * Check if we're in production mode
 */
export function isProd() {
  return config.app.isProduction;
}
