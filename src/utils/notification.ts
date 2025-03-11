import { AlertColor } from '@mui/material';

// 存储通知回调函数
let notificationCallback: ((message: string, severity: AlertColor) => void) | null = null;

// 设置通知回调函数
export const setNotificationCallback = (callback: (message: string, severity: AlertColor) => void) => {
  notificationCallback = callback;
};

// 全局通知函数，替代 alert()
export const showNotification = (message: string, severity: AlertColor = 'info') => {
  if (notificationCallback) {
    notificationCallback(message, severity);
  } else {
    // 如果回调未设置，回退到原生 alert
    alert(message);
  }
};

// 重写全局 alert 函数
// 注意：这种方法在严格模式下可能不被推荐，但在此场景下是有效的
const originalAlert = window.alert;
window.alert = (message: string) => {
  showNotification(message);
};

// 导出原始 alert 以备需要
export const originalAlertFn = originalAlert; 