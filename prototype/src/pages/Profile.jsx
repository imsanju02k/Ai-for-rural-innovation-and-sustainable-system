import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import {
  User, MapPin, Phone, Mail, Leaf, Calendar,
  Settings, LogOut, Edit, ChevronRight, Award,
  TrendingUp, Activity
} from 'lucide-react'

const Profile = () => {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [isEditing, setIsEditing] = useState(false)

  // User profile data
  const [profile, setProfile] = useState({
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@example.com',
    location: 'Bangalore, Karnataka',
    farmName: 'Green Valley Farm',
    farmSize: '5 acres',
    crops: ['Rice', 'Wheat', 'Cotton'],
    joinedDate: 'January 2024',
  })

  const stats = [
    {
      label: 'Crops Monitored',
      value: '3',
      icon: Leaf,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Detections',
      value: '24',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Success Rate',
      value: '92%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  const menuItems = [
    {
      icon: Settings,
      label: 'Settings',
      action: () => navigate('/settings'),
    },
    {
      icon: Award,
      label: 'Achievements',
      action: () => console.log('Achievements'),
    },
    {
      icon: LogOut,
      label: 'Logout',
      action: () => navigate('/login'),
      danger: true,
    },
  ]

  return (
    <div className={`min-h-screen pb-20 transition-theme duration-300 ${
      isDark ? 'bg-dark-bg' : 'bg-neutral-bg'
    }`}>
      <Header />

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className={`rounded-lg p-4 mb-6 ${
          isDark ? 'bg-dark-surface' : 'bg-white'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.name.charAt(0)}
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-neutral-text">
                  {profile.name}
                </h1>
                <p className="text-sm text-neutral-text-secondary mt-1">
                  Farmer since {profile.joinedDate}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-neutral-bg rounded-full transition-colors"
            >
              <Edit size={20} className="text-primary" />
            </button>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 pt-4 border-t border-neutral-divider">
            <div className="flex items-center text-sm">
              <Phone size={16} className="text-neutral-text-secondary mr-3" />
              <span className="text-neutral-text">{profile.phone}</span>
            </div>
            <div className="flex items-center text-sm">
              <Mail size={16} className="text-neutral-text-secondary mr-3" />
              <span className="text-neutral-text">{profile.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin size={16} className="text-neutral-text-secondary mr-3" />
              <span className="text-neutral-text">{profile.location}</span>
            </div>
          </div>
        </div>

        {/* Farm Details */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-neutral-text mb-4">
            Farm Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-text-secondary">Farm Name</span>
              <span className="text-sm font-medium text-neutral-text">
                {profile.farmName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-text-secondary">Farm Size</span>
              <span className="text-sm font-medium text-neutral-text">
                {profile.farmSize}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-neutral-text-secondary">Crops</span>
              <div className="flex flex-wrap gap-2 justify-end">
                {profile.crops.map((crop, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-text mb-4">
            Your Stats
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="card text-center">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <Icon size={20} className={stat.color} />
                  </div>
                  <p className="text-2xl font-bold text-neutral-text mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-neutral-text-secondary">
                    {stat.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Menu Items */}
        <div className="card">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={item.action}
                className={`w-full flex items-center justify-between py-4 ${index !== menuItems.length - 1 ? 'border-b border-neutral-divider' : ''
                  } hover:bg-neutral-bg transition-colors rounded ${item.danger ? 'text-status-error' : 'text-neutral-text'
                  }`}
              >
                <div className="flex items-center">
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight size={20} className="text-neutral-text-secondary" />
              </button>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default Profile
