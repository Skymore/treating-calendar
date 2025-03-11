/**
 * Get the base URL for the application, prioritizing environment variables over window.location
 * This helps ensure that links in emails point to the deployed URL rather than localhost
 * @returns The base URL for the application
 */
export function getAppBaseUrl(): string {
  // 在生产环境中始终使用固定的URL
  if (import.meta.env.PROD) {
    return 'https://treating.ruit.me';
  }
  
  // 在开发环境中使用环境变量或当前URL
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // 最后才使用window.location作为后备选项
  return window.location.origin;
} 