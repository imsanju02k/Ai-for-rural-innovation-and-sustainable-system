import { MapPin, Bell, Wifi, WifiOff, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const Header = ({ location = 'Bangalore, Karnataka', notificationCount = 3, showBack = false, title = null }) => {
  const [isOnline, setIsOnline] = useState(true)
  const navigate = useNavigate()
  const { isDark } = useTheme()

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
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-2">
              <span className="text-white font-bold text-sm">KS</span>
            </div>
            <span className="text-primary font-bold text-lg">KrishiSankalp AI</span>
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
        <div className="flex items-center space-x-3">
          {/* Online/Offline Indicator */}
          <div className="flex items-center">
            {isOnline ? (
              <Wifi size={20} className="text-status-success" />
            ) : (
              <WifiOff size={20} className="text-status-error" />
            )}
          </div>

          {/* Notifications */}
          <button className="relative">
            <Bell size={24} className={isDark ? 'text-dark-text' : 'text-neutral-text'} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
