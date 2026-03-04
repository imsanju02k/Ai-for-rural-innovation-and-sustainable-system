import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import {
    TrendingUp, Calendar, Leaf, Droplets, Sun, Wind,
    AlertCircle, CheckCircle, BarChart3, Target
} from 'lucide-react'

const YieldPrediction = () => {
    const navigate = useNavigate()
    const [selectedCrop, setSelectedCrop] = useState('rice')

    const crops = [
        {
            id: 'rice',
            name: 'Rice',
            icon: '🌾',
            currentYield: 4.2,
            predictedYield: 4.8,
            unit: 'tons/acre',
            confidence: 92,
            harvestDate: '2024-04-15',
            status: 'good',
        },
        {
            id: 'wheat',
            name: 'Wheat',
            icon: '🌾',
            currentYield: 3.5,
            predictedYield: 3.9,
            unit: 'tons/acre',
            confidence: 88,
            harvestDate: '2024-03-20',
            status: 'good',
        },
        {
            id: 'cotton',
            name: 'Cotton',
            icon: '🌱',
            currentYield: 2.1,
            predictedYield: 2.0,
            unit: 'tons/acre',
            confidence: 85,
            harvestDate: '2024-05-10',
            status: 'warning',
        },
    ]

    const factors = [
        {
            name: 'Soil Health',
            icon: Leaf,
            value: 85,
            status: 'good',
            impact: 'High',
        },
        {
            name: 'Water Availability',
            icon: Droplets,
            value: 78,
            status: 'good',
            impact: 'High',
        },
        {
            name: 'Weather Conditions',
            icon: Sun,
            value: 92,
            status: 'excellent',
            impact: 'Medium',
        },
        {
            name: 'Pest Control',
            icon: Wind,
            value: 70,
            status: 'warning',
            impact: 'Medium',
        },
    ]

    const recommendations = [
        {
            title: 'Optimize Irrigation',
            description: 'Increase watering frequency by 10% during flowering stage',
            impact: '+0.3 tons/acre',
            priority: 'high',
        },
        {
            title: 'Apply Micronutrients',
            description: 'Add zinc and boron supplements for better grain filling',
            impact: '+0.2 tons/acre',
            priority: 'medium',
        },
        {
            title: 'Pest Management',
            description: 'Monitor for stem borers and apply organic pesticides',
            impact: '+0.15 tons/acre',
            priority: 'high',
        },
    ]

    const selectedCropData = crops.find(c => c.id === selectedCrop)
    const yieldIncrease = ((selectedCropData.predictedYield - selectedCropData.currentYield) / selectedCropData.currentYield * 100).toFixed(1)

    return (
        <div className="min-h-screen bg-neutral-bg pb-20">
            <Header showBack={true} title="Yield Prediction" />

            <div className="max-w-md mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-neutral-text mb-6">
                    Yield Prediction
                </h1>

                {/* Crop Selection */}
                <div className="flex space-x-3 mb-6 overflow-x-auto pb-2">
                    {crops.map((crop) => (
                        <button
                            key={crop.id}
                            onClick={() => setSelectedCrop(crop.id)}
                            className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${selectedCrop === crop.id
                                    ? 'border-primary bg-green-50'
                                    : 'border-neutral-border bg-white'
                                }`}
                        >
                            <div className="text-2xl mb-1">{crop.icon}</div>
                            <p className="text-sm font-medium text-neutral-text">{crop.name}</p>
                        </button>
                    ))}
                </div>

                {/* Prediction Card */}
                <div className="card mb-6 bg-gradient-to-br from-primary to-green-600 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm opacity-90 mb-1">Predicted Yield</p>
                            <div className="flex items-baseline">
                                <span className="text-4xl font-bold">
                                    {selectedCropData.predictedYield}
                                </span>
                                <span className="text-lg ml-2 opacity-90">
                                    {selectedCropData.unit}
                                </span>
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <TrendingUp size={32} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white border-opacity-20">
                        <div>
                            <p className="text-sm opacity-90">Current Yield</p>
                            <p className="text-xl font-semibold">
                                {selectedCropData.currentYield} {selectedCropData.unit}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm opacity-90">Increase</p>
                            <p className="text-xl font-semibold">+{yieldIncrease}%</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <Target size={16} className="mr-2" />
                            <span className="text-sm">Confidence: {selectedCropData.confidence}%</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar size={16} className="mr-2" />
                            <span className="text-sm">Harvest: {new Date(selectedCropData.harvestDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Yield Factors */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-neutral-text mb-4">
                        Yield Factors
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {factors.map((factor, index) => {
                            const Icon = factor.icon
                            return (
                                <div key={index} className="card">
                                    <div className="flex items-center justify-between mb-3">
                                        <Icon size={20} className="text-primary" />
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${factor.status === 'excellent'
                                                    ? 'bg-green-50 text-green-600'
                                                    : factor.status === 'good'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-yellow-50 text-yellow-600'
                                                }`}
                                        >
                                            {factor.impact}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-text-secondary mb-2">
                                        {factor.name}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 bg-neutral-bg rounded-full h-2 mr-3">
                                            <div
                                                className={`h-2 rounded-full ${factor.value >= 80
                                                        ? 'bg-status-success'
                                                        : factor.value >= 60
                                                            ? 'bg-blue-600'
                                                            : 'bg-secondary-yellow'
                                                    }`}
                                                style={{ width: `${factor.value}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-semibold text-neutral-text">
                                            {factor.value}%
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Historical Trend */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-neutral-text">
                            Historical Trend
                        </h3>
                        <BarChart3 size={20} className="text-primary" />
                    </div>
                    <div className="flex items-end justify-between h-32">
                        {[3.2, 3.5, 3.8, 4.0, 4.2, 4.5, 4.8].map((value, index) => {
                            const maxValue = 5
                            const height = (value / maxValue) * 100
                            const isFuture = index >= 5
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                    <div
                                        className={`w-full mx-1 rounded-t transition-all ${isFuture
                                                ? 'bg-primary opacity-50 border-2 border-primary border-dashed'
                                                : 'bg-primary'
                                            }`}
                                        style={{ height: `${height}%` }}
                                    ></div>
                                    <span className="text-xs text-neutral-text-secondary mt-2">
                                        {isFuture ? 'P' : 'Y'}{index + 1}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex items-center justify-center mt-4 space-x-4 text-xs">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-primary rounded mr-2"></div>
                            <span className="text-neutral-text-secondary">Actual</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-primary opacity-50 border-2 border-primary border-dashed rounded mr-2"></div>
                            <span className="text-neutral-text-secondary">Predicted</span>
                        </div>
                    </div>
                </div>

                {/* AI Recommendations */}
                <div>
                    <h2 className="text-lg font-semibold text-neutral-text mb-4">
                        AI Recommendations to Maximize Yield
                    </h2>
                    <div className="space-y-4">
                        {recommendations.map((rec, index) => (
                            <div key={index} className="card">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-base font-semibold text-neutral-text flex-1">
                                        {rec.title}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${rec.priority === 'high'
                                                ? 'bg-red-50 text-red-600'
                                                : 'bg-yellow-50 text-yellow-600'
                                            }`}
                                    >
                                        {rec.priority}
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-text-secondary mb-3">
                                    {rec.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-status-success">
                                        <TrendingUp size={16} className="mr-1" />
                                        <span className="text-sm font-medium">{rec.impact}</span>
                                    </div>
                                    <button className="btn-primary text-sm px-4 py-2">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}

export default YieldPrediction
