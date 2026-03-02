import { MapPin, Bell, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'

const Header = ({ location = 'Bangalore, Karnataka', notificationCount = 3 }) => {
  const [isOnline, setIsOnline] = useState(true)

  return (
    <header className="bg-white border-b border-neutral-divider sticky top-0 z-40">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-neutral-text-secondary">
          <MapPin size={16} className="mr-1" />
          <span>{location}</span>
        </div>

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
            <Bell size={24} className="text-neutral-text" />
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
