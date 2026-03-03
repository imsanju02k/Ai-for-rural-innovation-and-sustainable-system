import { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize alerts from localStorage
  useEffect(() => {
    const savedAlerts = getItem(STORAGE_KEYS.USER_ALERTS, null);
    if (savedAlerts) {
      setAlerts(savedAlerts);
      updateUnreadCount(savedAlerts);
    }
  }, []);

  // Update unread count whenever alerts change
  useEffect(() => {
    updateUnreadCount(alerts);
  }, [alerts]);

  const updateUnreadCount = (alertsList) => {
    const count = alertsList.filter(a => !a.read).length;
    setUnreadCount(count);
  };

  const markAlertAsRead = (alertId) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    );
    setAlerts(updatedAlerts);
    setItem(STORAGE_KEYS.USER_ALERTS, updatedAlerts);
  };

  const markAllAsRead = () => {
    const updatedAlerts = alerts.map(alert => ({ ...alert, read: true }));
    setAlerts(updatedAlerts);
    setItem(STORAGE_KEYS.USER_ALERTS, updatedAlerts);
  };

  const deleteAlert = (alertId) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    setItem(STORAGE_KEYS.USER_ALERTS, updatedAlerts);
  };

  const updateAlerts = (newAlerts) => {
    setAlerts(newAlerts);
    setItem(STORAGE_KEYS.USER_ALERTS, newAlerts);
  };

  return (
    <AlertContext.Provider value={{
      alerts,
      unreadCount,
      markAlertAsRead,
      markAllAsRead,
      deleteAlert,
      updateAlerts,
    }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider');
  }
  return context;
};
