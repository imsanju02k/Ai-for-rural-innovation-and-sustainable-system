import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import {
    Moon, Sun, Bell, Globe, User, Shield, Info,
    ChevronRight, LogOut, Check
} from 'lucide-react';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';

const Settings = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme, isDark } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    const [notifications, setNotifications] = useState(() => {
        return getItem(STORAGE_KEYS.USER_SETTINGS, {
            weather: true,
            disease: true,
            market: true,
            irrigation: true,
            fertilizer: true,
        }).notifications || {
            weather: true,
            disease: true,
            market: true,
            irrigation: true,
            fertilizer: true,
        };
    });

    const [showLanguageModal, setShowLanguageModal] = useState(false);

    // Save settings whenever they change
    useEffect(() => {
        const settings = getItem(STORAGE_KEYS.USER_SETTINGS, {});
        settings.notifications = notifications;
        setItem(STORAGE_KEYS.USER_SETTINGS, settings);
    }, [notifications]);

    const handleNotificationToggle = (type) => {
        setNotifications(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const handleLogout = () => {
        if (window.confirm(t('confirmLogout') || 'Are you sure you want to logout?')) {
            // Clear auth data
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.AUTH_PHONE);
            navigate('/login');
        }
    };

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
        { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    ];

    const notificationTypes = [
        { key: 'weather', labelKey: 'weatherAlerts', descriptionKey: 'getNotifiedAboutWeatherChanges' },
        { key: 'disease', labelKey: 'diseaseAlerts', descriptionKey: 'cropDiseaseDetectionNotifications' },
        { key: 'market', labelKey: 'marketAlerts', descriptionKey: 'priceChangesAndMarketUpdates' },
        { key: 'irrigation', labelKey: 'irrigationReminders', descriptionKey: 'wateringScheduleReminders' },
        { key: 'fertilizer', labelKey: 'fertilizerReminders', descriptionKey: 'fertilizationScheduleAlerts' },
    ];

    const userProfile = getItem(STORAGE_KEYS.USER_PROFILE, {});
    const userPhone = userProfile?.phone || getItem(STORAGE_KEYS.AUTH_PHONE, '+91 98765 43210');
    const userEmail = userProfile?.email || 'Not set';

    return (
        <div className={`min-h-screen pb-20 transition-theme duration-300 ${isDark ? 'bg-dark-bg' : 'bg-neutral-bg'
            }`}>
            <Header showBack={true} title={t('settings')} />

            <div className="max-w-md mx-auto px-4 py-6">
                <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-dark-text' : 'text-neutral-text'
                    }`}>
                    {t('settings')}
                </h1>

                {/* Theme Section */}
                <div className={`rounded-lg p-4 mb-4 ${isDark ? 'bg-dark-surface' : 'bg-white'
                    }`}>
                    <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-dark-text' : 'text-neutral-text'
                        }`}>
                        {t('appearance')}
                    </h2>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {isDark ? (
                                <Moon size={20} className="text-primary mr-3" />
                            ) : (
                                <Sun size={20} className="text-primary mr-3" />
                            )}
                            <div>
                                <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                                    }`}>
                                    {t('darkMode')}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                                    }`}>
                                    {isDark ? t('enabled') : t('disabled')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className={`rounded-lg p-4 mb-4 ${isDark ? 'bg-dark-surface' : 'bg-white'
                    }`}>
                    <div className="flex items-center mb-4">
                        <Bell size={20} className="text-primary mr-3" />
                        <h2 className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'
                            }`}>
                            {t('notifications')}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {notificationTypes.map((type) => (
                            <div key={type.key} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                                        }`}>
                                        {t(type.labelKey)}
                                    </p>
                                    <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                                        }`}>
                                        {t(type.descriptionKey)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleNotificationToggle(type.key)}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${notifications[type.key] ? 'bg-primary' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${notifications[type.key] ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Language Section */}
                <div className={`rounded-lg p-4 mb-4 ${isDark ? 'bg-dark-surface' : 'bg-white'
                    }`}>
                    <button
                        onClick={() => setShowLanguageModal(true)}
                        className="w-full flex items-center justify-between"
                    >
                        <div className="flex items-center">
                            <Globe size={20} className="text-primary mr-3" />
                            <div className="text-left">
                                <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                                    }`}>
                                    {t('language')}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                                    }`}>
                                    {languages.find(l => l.code === language)?.name || 'English'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={20} className={
                            isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                        } />
                    </button>
                </div>

                {/* Account Section */}
                <div className={`rounded-lg p-4 mb-4 ${isDark ? 'bg-dark-surface' : 'bg-white'
                    }`}>
                    <div className="flex items-center mb-4">
                        <User size={20} className="text-primary mr-3" />
                        <h2 className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'
                            }`}>
                            {t('account')}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                                }`}>
                                {t('phoneNumber')}
                            </p>
                            <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                                }`}>
                                {userPhone}
                            </p>
                        </div>
                        <div>
                            <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                                }`}>
                                {t('email')}
                            </p>
                            <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                                }`}>
                                {userEmail}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Privacy Section */}
                <div className={`rounded-lg p-4 mb-4 ${isDark ? 'bg-dark-surface' : 'bg-white'
                    }`}>
                    <div className="flex items-center mb-4">
                        <Shield size={20} className="text-primary mr-3" />
                        <h2 className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'
                            }`}>
                            {t('privacy')}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                                }`}>
                                {t('dataSharing')}
                            </p>
                            <button className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300">
                                <span className="inline-block h-6 w-6 transform rounded-full bg-white translate-x-1" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                                }`}>
                                {t('analytics')}
                            </p>
                            <button className="relative inline-flex h-8 w-14 items-center rounded-full bg-primary">
                                <span className="inline-block h-6 w-6 transform rounded-full bg-white translate-x-7" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* App Info Section */}
                <div className={`rounded-lg p-4 mb-4 ${isDark ? 'bg-dark-surface' : 'bg-white'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Info size={20} className="text-primary mr-3" />
                            <div>
                                <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                                    }`}>
                                    {t('appVersion')}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                                    }`}>
                                    1.0.0
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className={`w-full rounded-lg p-4 flex items-center justify-center ${isDark ? 'bg-dark-surface' : 'bg-white'
                        }`}
                >
                    <LogOut size={20} className="text-status-error mr-3" />
                    <span className="font-medium text-status-error">{t('logout')}</span>
                </button>
            </div>

            {/* Language Modal */}
            {showLanguageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-lg p-6 w-full max-w-sm ${isDark ? 'bg-dark-surface' : 'bg-white'
                        }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-dark-text' : 'text-neutral-text'
                            }`}>
                            {t('selectLanguage')}
                        </h3>
                        <div className="space-y-2">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setShowLanguageModal(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${language === lang.code
                                        ? isDark ? 'bg-dark-bg' : 'bg-neutral-bg'
                                        : ''
                                        }`}
                                >
                                    <div>
                                        <p className={`font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'
                                            }`}>
                                            {lang.name}
                                        </p>
                                        <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'
                                            }`}>
                                            {lang.nativeName}
                                        </p>
                                    </div>
                                    {language === lang.code && (
                                        <Check size={20} className="text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowLanguageModal(false)}
                            className="w-full mt-4 py-2 text-primary font-medium"
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default Settings;
