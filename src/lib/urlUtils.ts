/**
 * Get the base URL for the application, prioritizing environment variables over window.location
 * This helps ensure that links in emails point to the deployed URL rather than localhost
 * @returns The base URL for the application
 */
export function getAppBaseUrl(): string {
  // First check for environment variable
  const envUrl = import.meta.env.VITE_APP_URL;
  
  // If environment variable is set, use it
  if (envUrl) {
    return envUrl;
  }
  
  // Otherwise, use window.location as fallback
  // This will work for development but not ideal for production
  // Extract the origin (protocol + hostname + port)
  return window.location.origin;
} 