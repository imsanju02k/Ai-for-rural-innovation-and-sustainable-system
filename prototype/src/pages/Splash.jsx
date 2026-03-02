import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, Sparkles } from 'lucide-react'

const Splash = () => {
    const navigate = useNavigate()

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/onboarding')
        }, 2000)

        return () => clearTimeout(timer)
    }, [navigate])

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center">
            <div className="flex flex-col items-center space-y-6 animate-fade-in">
                {/* Logo */}
                <div className="relative">
                    <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Leaf size={64} className="text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-secondary-yellow rounded-full flex items-center justify-center">
                        <Sparkles size={20} className="text-white" />
                    </div>
                </div>

                {/* App Name */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-primary mb-2">
                        KrishiSankalp AI
                    </h1>
                    <p className="text-sm text-neutral-text-secondary tracking-wide">
                        कृषि संकल्प
                    </p>
                </div>

                {/* Tagline */}
                <p className="text-neutral-text-secondary text-center px-8 text-lg">
                    Empowering Farmers with AI-Driven Insights
                </p>

                {/* Loading Spinner */}
                <div className="mt-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    )
}

export default Splash
