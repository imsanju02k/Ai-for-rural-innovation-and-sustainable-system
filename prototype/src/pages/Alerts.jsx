import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import {
  Cloud, Bug, TrendingUp, Droplets, Leaf,
  CheckCircle, AlertTriangle, Info, X
} from 'lucide-react';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';

const Alerts = () => {
  const { isDark } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');

  // Initialize with sample alerts if none exist
  useEffect(() => {
    const savedAlerts = getItem(STORAGE_KEYS.USER_ALERTS, null);

    if (!savedAlerts || savedAlerts.length === 0) {
      const sampleAlerts = [
        {
          id: '1',
          type: 'weather',
          title: 'Heavy Rain Expected',
          message: 'Heavy rainfall predicted for the next 48 hours. Consider postponing irrigation.',
          severity: 'warning',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          type: 'disease',
          title: 'Rice Blast Detected',
          message: 'Disease detection system identified potential rice blast in your field. Check immediately.',
          severity: 'critical',
          read: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '3',
          type: 'market',
          title: 'Price Increase Alert',
          message: 'Rice prices increased by 12% to ₹2,550/quintal. Good time to sell.',
          severity: 'info',
          read: true,
          createdAt: new Date(Date.now() - 18000000).toISOString(),
        },
        {
          id: '4',
          type: 'irrigation',
          title: 'Irrigation Reminder',
          message: 'Time to water your wheat crop. Soil moisture is below optimal level.',
          severity: 'info',
          read: false,
          createdAt: new Date(Date.now() - 28800000).toISOString(),
        },
        {
          id: '5',
          type: 'fertilizer',
          title: 'Fertilizer Application Due',
          message: 'Apply NPK fertilizer to your rice crop. Optimal timing for panicle stage.',
          severity: 'warning',
          read: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setAlerts(sampleAlerts);
      setItem(STORAGE_KEYS.USER_ALERTS, sampleAlerts);
    } else {
      setAlerts(savedAlerts);
    }
  }, []);

  // Save alerts whenever they change
  useEffect(() => {
    if (alerts.length > 0) {
      setItem(STORAGE_KEYS.USER_ALERTS, alerts);
    }
  }, [alerts]);

  // Mark all as read when visiting alerts page
  useEffect(() => {
    const unreadAlerts = alerts.filter(a => !a.read);
    if (unreadAlerts.length > 0) {
      handleMarkAllAsRead();
    }
  }, []);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'weather': return Cloud;
      case 'disease': return Bug;
      case 'market': return TrendingUp;
      case 'irrigation': return Droplets;
      case 'fertilizer': return Leaf;
      default: return Info;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-status-error bg-red-50';
      case 'warning': return 'text-secondary-yellow bg-yellow-50';
      case 'info': return 'text-status-info bg-blue-50';
      default: return 'text-neutral-text-secondary bg-neutral-bg';
    }
  };

  const handleMarkAsRead = (alertId) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const handleMarkAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, read: true })));
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(alert => alert.type === filter);

  const unreadCount = alerts.filter(a => !a.read).length;

  const filterOptions = [
    { value: 'all', label: 'All', icon: null },
    { value: 'weather', label: 'Weather', icon: Cloud },
    { value: 'disease', label: 'Disease', icon: Bug },
    { value: 'market', label: 'Market', icon: TrendingUp },
    { value: 'irrigation', label: 'Irrigation', icon: Droplets },
    { value: 'fertilizer', label: 'Fertilizer', icon: Leaf },
  ];

  return (
    <div className={`min-h-screen pb-20 transition-theme duration-300 ${isDark ? 'bg-dark-bg' : 'bg-neutral-bg'
      }`}>
      <Header showBack={true} title="Alerts" />

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header with unread count */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-neutral-text'
              }`}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className={`text-sm mt-1 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                }`}>
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-primary text-sm font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto space-x-2 mb-6 pb-2 scrollbar-hide">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`flex items-center px-4 py-2 rounded-full whitespace-nowrap transition-colors ${filter === option.value
                    ? 'bg-primary text-white'
                    : isDark
                      ? 'bg-dark-surface text-dark-text'
                      : 'bg-white text-neutral-text'
                  }`}
              >
                {Icon && <Icon size={16} className="mr-2" />}
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className={`rounded-lg p-8 text-center ${isDark ? 'bg-dark-surface' : 'bg-white'
              }`}>
              <p className={isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}>
                No alerts to display
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  onClick={() => !alert.read && handleMarkAsRead(alert.id)}
                  className={`rounded-lg p-4 cursor-pointer transition-all ${isDark ? 'bg-dark-surface' : 'bg-white'
                    } ${!alert.read ? 'border-l-4 border-primary' : ''}`}
                >
                  <div className="flex items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getAlertColor(alert.severity)
                      }`}>
                      <Icon size={20} />
                    </div>

                    <div className="ml-3 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'
                            }`}>
                            {alert.title}
                          </h3>
                          <p className={`text-sm mt-1 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                            }`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center mt-2 space-x-3">
                            <span className={`text-xs ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                              }`}>
                              {formatTime(alert.createdAt)}
                            </span>
                            {!alert.read && (
                              <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAlert(alert.id);
                          }}
                          className={`ml-2 p-1 rounded-full hover:bg-opacity-10 hover:bg-black ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                            }`}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Alerts;
