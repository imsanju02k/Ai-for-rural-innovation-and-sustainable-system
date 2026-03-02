import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import {
    Camera, TrendingUp, DollarSign, Droplet,
    MessageCircle, Activity, Leaf, Sun,
    TrendingUp as TrendUp, Droplets
} from 'lucide-react'

const Dashboard = () => {
    const navigate = useNavigate()

    const quickStats = [
        {
            title: 'Crop Health',
            value: '85%',
            icon: Leaf,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Weather',
            value: '32°C',
            subtitle: 'Sunny',
            icon: Sun,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            title: 'Market Price',
            value: '₹2,550',
            subtitle: '↑12%',
            icon: TrendUp,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Water Usage',
            value: '68%',
            subtitle: 'Efficient',
            icon: Droplets,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
        },
    ]

    const mainActions = [
        {
            title: 'Disease Detection',
            icon: Camera,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            path: '/disease-detection',
        },
        {
            title: 'Yield Prediction',
            icon: TrendingUp,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            path: '/yield-prediction',
        },
        {
            title: 'Market Prices',
            icon: DollarSign,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            path: '/market-prices',
        },
        {
            title: 'Resource Optimizer',
            icon: Droplet,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            path: '/resource-optimizer',
        },
        {
            title: 'Ask Advisor',
            icon: MessageCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            path: '/advisory',
        },
        {
            title: 'Sensor Monitor',
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
        <div className="min-h-screen bg-neutral-bg pb-20">
            <Header />

            <div className="max-w-md mx-auto px-4 py-6">
                {/* Quick Stats */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-neutral-text mb-4">
                        Quick Stats
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
                                    <p className="text-sm text-neutral-text-secondary mb-1">
                                        {stat.title}
                                    </p>
                                    <p className="text-2xl font-bold text-neutral-text">
                                        {stat.value}
                                    </p>
                                    {stat.subtitle && (
                                        <p className="text-sm text-neutral-text-secondary mt-1">
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
                    <h2 className="text-lg font-semibold text-neutral-text mb-4">
                        Main Actions
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
                                    <p className="text-sm font-medium text-neutral-text">
                                        {action.title}
                                    </p>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <div>
                    <h2 className="text-lg font-semibold text-neutral-text mb-4">
                        Recent Activity
                    </h2>
                    <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="card flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-neutral-text">
                                        {activity.title}
                                    </p>
                                    <p className="text-xs text-neutral-text-secondary mt-1">
                                        {activity.time}
                                    </p>
                                </div>
                                <button className="text-primary text-sm font-medium">
                                    View
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
