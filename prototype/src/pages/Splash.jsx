import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'

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
                <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <Leaf size={64} className="text-white" />
                </div>

                {/* App Name */}
                <h1 className="text-3xl font-bold text-neutral-text text-center">
                    AI Rural Innovation
                </h1>

                {/* Tagline */}
                <p className="text-neutral-text-secondary text-center px-8">
                    Empowering Farmers with AI
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
