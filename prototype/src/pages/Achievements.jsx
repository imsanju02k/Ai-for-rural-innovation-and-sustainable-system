import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { Trophy, Star, Target, Zap, Award, TrendingUp } from 'lucide-react'

const Achievements = () => {
    const { isDark } = useTheme()
    const [achievements, setAchievements] = useState([
        {
            id: 1,
            title: 'First Harvest',
            description: 'Complete your first crop cycle',
            icon: Trophy,
            unlocked: true,
            unlockedDate: '2024-01-15',
            progress: 100,
        },
        {
            id: 2,
            title: 'Disease Detective',
            description: 'Identify 5 different crop diseases',
            icon: Target,
            unlocked: true,
            unlockedDate: '2024-02-10',
            progress: 100,
        },
        {
            id: 3,
            title: 'Market Master',
            description: 'Check market prices 20 times',
            icon: TrendingUp,
            unlocked: false,
            progress: 12,
        },
        {
            id: 4,
            title: 'Community Champion',
            description: 'Make 10 posts in the community',
            icon: Star,
            unlocked: false,
            progress: 3,
        },
        {
            id: 5,
            title: 'Sensor Savvy',
            description: 'Monitor sensors for 30 days',
            icon: Zap,
            unlocked: false,
            progress: 8,
        },
        {
            id: 6,
            title: 'Expert Farmer',
            description: 'Achieve 90% success rate on crops',
            icon: Award,
            unlocked: false,
            progress: 75,
        },
    ])

    const unlockedCount = achievements.filter(a => a.unlocked).length
    const totalPoints = achievements.reduce((sum, a) => sum + (a.unlocked ? 100 : 0), 0)

    return (
        <div className={`min-h-screen pb-20 transition-theme duration-300 ${isDark ? 'bg-dark-bg' : 'bg-neutral-bg'}`}>
            <Header showBack={true} title="Achievements" />

            <div className="max-w-md mx-auto px-4 py-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className={`card p-4 text-center ${isDark ? 'bg-dark-surface' : 'bg-white'}`}>
                        <Trophy className="text-secondary-yellow mx-auto mb-2" size={24} />
                        <p className={`text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                            {unlockedCount}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                            Unlocked
                        </p>
                    </div>
                    <div className={`card p-4 text-center ${isDark ? 'bg-dark-surface' : 'bg-white'}`}>
                        <Star className="text-primary mx-auto mb-2" size={24} />
                        <p className={`text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                            {totalPoints}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                            Points
                        </p>
                    </div>
                    <div className={`card p-4 text-center ${isDark ? 'bg-dark-surface' : 'bg-white'}`}>
                        <Award className="text-status-success mx-auto mb-2" size={24} />
                        <p className={`text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                            {Math.round((unlockedCount / achievements.length) * 100)}%
                        </p>
                        <p className={`text-xs ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                            Complete
                        </p>
                    </div>
                </div>

                {/* Achievements List */}
                <div className="space-y-4">
                    {achievements.map((achievement) => {
                        const Icon = achievement.icon
                        return (
                            <div
                                key={achievement.id}
                                className={`card p-4 transition-all ${achievement.unlocked
                                        ? isDark
                                            ? 'bg-dark-surface border-primary'
                                            : 'bg-white border-primary'
                                        : isDark
                                            ? 'bg-dark-surface opacity-60'
                                            : 'bg-white opacity-60'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${achievement.unlocked
                                                ? 'bg-primary bg-opacity-20'
                                                : isDark
                                                    ? 'bg-dark-divider'
                                                    : 'bg-neutral-divider'
                                            }`}
                                    >
                                        <Icon
                                            size={24}
                                            className={achievement.unlocked ? 'text-primary' : isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                            {achievement.title}
                                        </h3>
                                        <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                            {achievement.description}
                                        </p>
                                        {!achievement.unlocked && (
                                            <div className="mt-2">
                                                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-dark-divider' : 'bg-neutral-divider'}`}>
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${achievement.progress}%` }}
                                                    ></div>
                                                </div>
                                                <p className={`text-xs mt-1 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                                    {achievement.progress}% complete
                                                </p>
                                            </div>
                                        )}
                                        {achievement.unlocked && (
                                            <p className={`text-xs mt-1 text-status-success`}>
                                                Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <BottomNav />
        </div>
    )
}

export default Achievements
