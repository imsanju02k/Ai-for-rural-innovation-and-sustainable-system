import { MapPin, Bell, Wifi, WifiOff, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { getItem, STORAGE_KEYS } from '../utils/localStorage'
import appLogo from '../applogo.png'

const Header = ({ location = 'Bangalore, Karnataka', notificationCount = 3, showBack = false, title = null }) => {
  const [isOnline, setIsOnline] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const currentLocation = useLocation()
  const { isDark } = useTheme()
  const { t } = useLanguage()

  // Update unread count from alerts
  useEffect(() => {
    const alerts = getItem(STORAGE_KEYS.USER_ALERTS, [])
    const unread = alerts.filter(a => !a.read).length
    setUnreadCount(unread)
  }, [currentLocation])

  return (
    <header className={`border-b sticky top-0 z-40 transition-theme duration-300 ${isDark
        ? 'bg-dark-surface border-dark-divider'
        : 'bg-white border-neutral-divider'
      }`}>
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left Side - Back button or Logo */}
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center ${isDark ? 'text-dark-text' : 'text-neutral-text'
              }`}
          >
            <ArrowLeft size={24} className="mr-2" />
            {title && <span className="font-semibold text-lg">{title}</span>}
          </button>
        ) : (
          <div className="flex items-center">
            <img src={appLogo} alt={t('krishisankalp')} className="w-8 h-8 mr-2 rounded-full" />
            <span className="text-primary font-bold text-lg">{t('krishisankalp')}</span>
          </div>
        )}

        {/* Location - only show if no back button */}
        {!showBack && (
          <div className={`flex items-center text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
            }`}>
            <MapPin size={16} className="mr-1" />
            <span className="hidden sm:inline">{location}</span>
          </div>
        )}

        {/* Right Icons */}
        <div className="flex items-center space-x-4">
          {/* Online/Offline Indicator */}
          <div className="flex items-center justify-center">
            {isOnline ? (
              <Wifi size={20} className="text-status-success" />
            ) : (
              <WifiOff size={20} className="text-status-error" />
            )}
          </div>

          {/* Notifications */}
          <button onClick={() => navigate('/alerts')} className="relative flex items-center justify-center">
            <Bell size={24} className={isDark ? 'text-dark-text' : 'text-neutral-text'} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
