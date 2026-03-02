import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, TrendingUp, Droplet, ChevronRight } from 'lucide-react'

const Onboarding = ({ onComplete }) => {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      icon: Camera,
      title: 'Detect Crop Diseases Instantly',
      description: 'Take a photo and get AI-powered disease identification in seconds',
      color: 'text-green-600',
    },
    {
      icon: TrendingUp,
      title: 'Get Best Market Prices',
      description: 'Access real-time prices from nearby markets and connect with buyers',
      color: 'text-blue-600',
    },
    {
      icon: Droplet,
      title: 'Optimize Resources with AI',
      description: 'Save water and increase yields with smart recommendations',
      color: 'text-cyan-600',
    },
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
      navigate('/login')
    }
  }

  const handleSkip = () => {
    onComplete()
    navigate('/login')
  }

  const Icon = slides[currentSlide].icon

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Skip Button */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleSkip}
          className="text-neutral-text-secondary hover:text-neutral-text"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Icon */}
        <div className={`mb-8 ${slides[currentSlide].color}`}>
          <Icon size={120} strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-neutral-text text-center mb-4">
          {slides[currentSlide].title}
        </h2>

        {/* Description */}
        <p className="text-neutral-text-secondary text-center mb-12">
          {slides[currentSlide].description}
        </p>

        {/* Progress Dots */}
        <div className="flex space-x-2 mb-12">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-neutral-divider'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="p-6">
        <button
          onClick={handleNext}
          className="btn-primary w-full flex items-center justify-center"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight size={20} className="ml-2" />
        </button>
      </div>
    </div>
  )
}

export default Onboarding
