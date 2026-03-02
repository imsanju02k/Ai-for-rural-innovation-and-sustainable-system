import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import {
    Camera, TrendingUp, DollarSign, Droplet,
    MessageCircle, Activity, Leaf, Sun,
    TrendingUp as TrendUp, Droplets
} from 'lucide-react'

const Dashboard = () => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { isDark } = useTheme()

    const quickStats = [
        {
            titleKey: 'cropHealth',
            value: '85%',
            icon: Leaf,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            titleKey: 'weather',
            value: '32°C',
            subtitle: 'Sunny',
            icon: Sun,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            titleKey: 'marketPrice',
            value: '₹2,550',
            subtitle: '↑12%',
            icon: TrendUp,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            titleKey: 'waterUsage',
            value: '68%',
            subtitle: 'Efficient',
            icon: Droplets,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
        },
    ]

    const mainActions = [
        {
            titleKey: 'diseaseDetection',
            icon: Camera,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            path: '/disease-detection',
        },
        {
            titleKey: 'yieldPrediction',
            icon: TrendingUp,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            path: '/yield-prediction',
        },
        {
            titleKey: 'marketPrices',
            icon: DollarSign,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            path: '/market-prices',
        },
        {
            titleKey: 'resourceOptimizer',
            icon: Droplet,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            path: '/resource-optimizer',
        },
        {
            titleKey: 'askAdvisor',
            icon: MessageCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            path: '/advisory',
        },
        {
            titleKey: 'sensorMonitor',
            icon: Activity,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            path: '/sensors',
        },
    ]

    const recentActivity = [
        {
            title: 'Disease Detected: Rice Blast',
            time: '2 hours ago',
            type: 'disease',
        },
        {
            title: 'Market Price Alert: ₹2,550/quintal',
            time: '5 hours ago',
            type: 'price',
        },
        {
            title: 'Irrigation Reminder',
            time: 'Yesterday',
            type: 'irrigation',
        },
    ]

    return (
        <div className={`min-h-screen pb-20 transition-theme duration-300 ${isDark ? 'bg-dark-bg' : 'bg-neutral-bg'}`}>
            <Header />

            <div className="max-w-md mx-auto px-4 py-6">
                {/* Quick Stats */}
                <div className="mb-6">
                    <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                        {t('quickStats')}
                    </h2>
                    <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
                        {quickStats.map((stat, index) => {
                            const Icon = stat.icon
                            return (
                                <div
                                    key={index}
                                    className="card min-w-[140px] flex-shrink-0"
                                >
                                    <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mb-3`}>
                                        <Icon size={24} className={stat.color} />
                                    </div>
                                    <p className={`text-sm mb-1 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                        {t(stat.titleKey)}
                                    </p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                        {stat.value}
                                    </p>
                                    {stat.subtitle && (
                                        <p className={`text-sm mt-1 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                            {stat.subtitle}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Main Actions */}
                <div className="mb-6">
                    <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                        {t('mainActions')}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {mainActions.map((action, index) => {
                            const Icon = action.icon
                            return (
                                <button
                                    key={index}
                                    onClick={() => navigate(action.path)}
                                    className="card card-hover flex flex-col items-center justify-center p-6 text-center"
                                >
                                    <div className={`w-16 h-16 ${action.bgColor} rounded-full flex items-center justify-center mb-3`}>
                                        <Icon size={32} className={action.color} />
                                    </div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                        {t(action.titleKey)}
                                    </p>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <div>
                    <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                        {t('recentActivity')}
                    </h2>
                    <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className={`card flex items-center justify-between ${isDark ? 'bg-dark-surface' : 'bg-white'}`}>
                                <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                        {activity.title}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                        {activity.time}
                                    </p>
                                </div>
                                <button className="text-primary text-sm font-medium">
                                    {t('view')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}

export default Dashboard
