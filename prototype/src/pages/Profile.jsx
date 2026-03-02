import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import {
  User, MapPin, Phone, Mail, Leaf, Calendar,
  Settings, LogOut, Edit, ChevronRight, Award,
  TrendingUp, Activity, Save, X, Camera
} from 'lucide-react';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';

const Profile = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load profile from LocalStorage or use defaults
  const [profile, setProfile] = useState(() => {
    const saved = getItem(STORAGE_KEYS.USER_PROFILE, null);
    return saved || {
      name: 'Rajesh Kumar',
      phone: getItem(STORAGE_KEYS.AUTH_PHONE, '+91 98765 43210'),
      email: 'rajesh.kumar@example.com',
      location: 'Bangalore, Karnataka',
      farmName: 'Green Valley Farm',
      farmSize: '5 acres',
      crops: ['Rice', 'Wheat', 'Cotton'],
      photo: null,
      joinedDate: 'January 2024',
    };
  });

  const [editedProfile, setEditedProfile] = useState(profile);
  const [errors, setErrors] = useState({});

  const stats = [
    {
      labelKey: 'cropsMonitored',
      value: profile.crops.length.toString(),
      icon: Leaf,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      labelKey: 'detections',
      value: '24',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      labelKey: 'successRate',
      value: '92%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const menuItems = [
    {
      icon: Settings,
      labelKey: 'settings',
      action: () => navigate('/settings'),
    },
    {
      icon: Award,
      labelKey: 'achievements',
      action: () => navigate('/achievements'),
    },
    {
      icon: LogOut,
      labelKey: 'logout',
      action: () => {
        if (window.confirm(t('confirmLogout'))) {
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.AUTH_PHONE);
          navigate('/login');
        }
      },
      danger: true,
    },
  ];

  const handleEdit = () => {
    setEditedProfile(profile);
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setErrors({});
    setIsEditing(false);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return re.test(phone);
  };

  const handleSave = () => {
    const newErrors = {};

    if (!editedProfile.name.trim()) {
      newErrors.name = t('nameRequired');
    }

    if (!validateEmail(editedProfile.email)) {
      newErrors.email = t('invalidEmailFormat');
    }

    if (!validatePhone(editedProfile.phone)) {
      newErrors.phone = t('invalidPhoneFormat');
    }

    if (!editedProfile.farmName.trim()) {
      newErrors.farmName = t('farmNameRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProfile(editedProfile);
    setItem(STORAGE_KEYS.USER_PROFILE, editedProfile);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile({ ...editedProfile, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`min-h-screen pb-20 transition-theme duration-300 ${isDark ? 'bg-dark-bg' : 'bg-neutral-bg'
      }`}>
      <Header />

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-status-success text-white px-6 py-3 rounded-lg shadow-lg">
          {t('profileUpdatedSuccessfully')}
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-dark-surface' : 'bg-white'
          }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="relative">
                {editedProfile.photo ? (
                  <img
                    src={editedProfile.photo}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name.charAt(0)}
                  </div>
                )}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="ml-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    className={`text-xl font-bold border-b-2 focus:outline-none ${errors.name ? 'border-status-error' : 'border-primary'
                      } ${isDark ? 'bg-dark-surface text-dark-text' : 'bg-white text-neutral-text'}`}
                  />
                ) : (
                  <h1 className={`text-xl font-bold ${isDark ? 'text-dark-text' : 'text-neutral-text'
                    }`}>
                    {profile.name}
                  </h1>
                )}
                <p className={`text-sm mt-1 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                  }`}>
                  {t('farmerSince')} {profile.joinedDate}
                </p>
                {errors.name && <p className="text-status-error text-xs mt-1">{errors.name}</p>}
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-dark-bg' : 'hover:bg-neutral-bg'
                  }`}
              >
                <Edit size={20} className="text-primary" />
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="p-2 bg-primary text-white rounded-full"
                >
                  <Save size={20} />
                </button>
                <button
                  onClick={handleCancel}
                  className={`p-2 rounded-full ${isDark ? 'bg-dark-bg text-dark-text' : 'bg-neutral-bg text-neutral-text'
                    }`}
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-dark-divider' : 'border-neutral-divider'
            }`}>
            <div className="flex items-center text-sm">
              <Phone size={16} className={
                isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
              } />
              {isEditing ? (
                <div className="ml-3 flex-1">
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    className={`w-full border-b focus:outline-none ${errors.phone ? 'border-status-error' : 'border-gray-300'
                      } ${isDark ? 'bg-dark-surface text-dark-text' : 'bg-white text-neutral-text'}`}
                  />
                  {errors.phone && <p className="text-status-error text-xs mt-1">{errors.phone}</p>}
                </div>
              ) : (
                <span className={`ml-3 ${isDark ? 'text-dark-text' : 'text-neutral-text'
                  }`}>{profile.phone}</span>
              )}
            </div>
            <div className="flex items-center text-sm">
              <Mail size={16} className={
                isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
              } />
              {isEditing ? (
                <div className="ml-3 flex-1">
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    className={`w-full border-b focus:outline-none ${errors.email ? 'border-status-error' : 'border-gray-300'
                      } ${isDark ? 'bg-dark-surface text-dark-text' : 'bg-white text-neutral-text'}`}
                  />
                  {errors.email && <p className="text-status-error text-xs mt-1">{errors.email}</p>}
                </div>
              ) : (
                <span className={`ml-3 ${isDark ? 'text-dark-text' : 'text-neutral-text'
                  }`}>{profile.email}</span>
              )}
            </div>
            <div className="flex items-center text-sm">
              <MapPin size={16} className={
                isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
              } />
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.location}
                  onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                  className={`ml-3 flex-1 border-b focus:outline-none border-gray-300 ${isDark ? 'bg-dark-surface text-dark-text' : 'bg-white text-neutral-text'
                    }`}
                />
              ) : (
                <span className={`ml-3 ${isDark ? 'text-dark-text' : 'text-neutral-text'
                  }`}>{profile.location}</span>
              )}
            </div>
          </div>
        </div>

        {/* Farm Details */}
        <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-dark-surface' : 'bg-white'
          }`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-dark-text' : 'text-neutral-text'
            }`}>
            {t('farmDetails')}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                }`}>{t('farmName')}</span>
              {isEditing ? (
                <div className="flex-1 ml-4">
                  <input
                    type="text"
                    value={editedProfile.farmName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, farmName: e.target.value })}
                    className={`w-full text-right border-b focus:outline-none ${errors.farmName ? 'border-status-error' : 'border-gray-300'
                      } ${isDark ? 'bg-dark-surface text-dark-text' : 'bg-white text-neutral-text'}`}
                  />
                  {errors.farmName && <p className="text-status-error text-xs mt-1">{errors.farmName}</p>}
                </div>
              ) : (
                <span className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                  }`}>
                  {profile.farmName}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                }`}>{t('farmSize')}</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.farmSize}
                  onChange={(e) => setEditedProfile({ ...editedProfile, farmSize: e.target.value })}
                  className={`text-right border-b focus:outline-none border-gray-300 ${isDark ? 'bg-dark-surface text-dark-text' : 'bg-white text-neutral-text'
                    }`}
                />
              ) : (
                <span className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                  }`}>
                  {profile.farmSize}
                </span>
              )}
            </div>
            <div className="flex justify-between items-start">
              <span className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                }`}>{t('crops')}</span>
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
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-dark-text' : 'text-neutral-text'
            }`}>
            {t('yourStats')}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className={`rounded-lg p-4 text-center ${isDark ? 'bg-dark-surface' : 'bg-white'
                  }`}>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <Icon size={20} className={stat.color} />
                  </div>
                  <p className={`text-2xl font-bold mb-1 ${isDark ? 'text-dark-text' : 'text-neutral-text'
                    }`}>
                    {stat.value}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                    }`}>
                    {t(stat.labelKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Menu Items */}
        <div className={`rounded-lg ${isDark ? 'bg-dark-surface' : 'bg-white'
          }`}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className={`w-full flex items-center justify-between py-4 px-4 ${index !== menuItems.length - 1
                  ? isDark ? 'border-b border-dark-divider' : 'border-b border-neutral-divider'
                  : ''
                  } transition-colors rounded ${isDark ? 'hover:bg-dark-bg' : 'hover:bg-neutral-bg'
                  } ${item.danger ? 'text-status-error' : isDark ? 'text-dark-text' : 'text-neutral-text'
                  }`}
              >
                <div className="flex items-center">
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{t(item.labelKey)}</span>
                </div>
                <ChevronRight size={20} className={
                  isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                } />
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
