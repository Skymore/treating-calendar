import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { setNotificationCallback } from '../utils/notification';

// Define the notification context type
interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
}

// Create the context with a default value
const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Props for the NotificationProvider component
interface NotificationProviderProps {
  children: ReactNode;
}

// The NotificationProvider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  // Function to show a notification
  const showNotification = (message: string, severity: AlertColor = 'info') => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  };

  // Set the notification callback when the component mounts
  useEffect(() => {
    setNotificationCallback(showNotification);
    // No need to clean up as the app will always have this provider
  }, []);

  // Function to handle closing the notification
  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}; 