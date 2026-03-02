import { Home, Sprout, Bell, Users, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Sprout, label: 'Farms', path: '/farms' },
    { icon: Bell, label: 'Alerts', path: '/alerts', badge: 3 },
    { icon: Users, label: 'Community', path: '/community' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-divider z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative ${
                isActive ? 'text-primary' : 'text-neutral-text-secondary'
              }`}
            >
              <div className="relative">
                <Icon size={24} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-secondary-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
