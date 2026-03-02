import { useState } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { Droplets, Zap, Leaf, TrendingDown, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

const ResourceOptimizer = () => {
  const [selectedResource, setSelectedResource] = useState('water')

  const resources = [
    {
      id: 'water',
      name: 'Water',
      icon: Droplets,
      current: 68,
      optimal: 55,
      unit: '%',
      status: 'warning',
      color: 'blue',
      savings: '15%',
    },
    {
      id: 'energy',
      name: 'Energy',
      icon: Zap,
      current: 82,
      optimal: 75,
      unit: 'kWh',
      status: 'warning',
      color: 'yellow',
      savings: '8%',
    },
    {
      id: 'fertilizer',
      name: 'Fertilizer',
      icon: Leaf,
      current: 45,
      optimal: 50,
      unit: 'kg',
      status: 'good',
      color: 'green',
      savings: '0%',
    },
  ]

  const recommendations = {
    water: [
      {
        title: 'Reduce irrigation frequency',
        description: 'Current soil moisture is adequate. Reduce watering by 2 days per week.',
        impact: 'Save 500L per week',
        priority: 'high',
      },
      {
        title: 'Install drip irrigation',
        description: 'Switch to drip irrigation for 30% better water efficiency.',
        impact: 'Save ₹2,000/month',
        priority: 'medium',
      },
      {
        title: 'Optimize watering schedule',
        description: 'Water during early morning (5-7 AM) to reduce evaporation.',
        impact: 'Save 200L per week',
        priority: 'high',
      },
    ],
    energy: [
      {
        title: 'Use solar pumps',
        description: 'Switch to solar-powered irrigation pumps during peak hours.',
        impact: 'Save ₹1,500/month',
        priority: 'high',
      },
      {
        title: 'Optimize pump timing',
        description: 'Run pumps during off-peak hours (10 PM - 6 AM).',
        impact: 'Save 15 kWh/day',
        priority: 'medium',
      },
    ],
    fertilizer: [
      {
        title: 'Maintain current usage',
        description: 'Your fertilizer usage is optimal. Continue current practices.',
        impact: 'Optimal efficiency',
        priority: 'low',
      },
      {
        title: 'Consider organic alternatives',
        description: 'Mix 20% organic compost to improve soil health.',
        impact: 'Better soil quality',
        priority: 'medium',
      },
    ],
  }

  const selectedResourceData = resources.find(r => r.id === selectedResource)
  const Icon = selectedResourceData.icon

  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      <Header />

      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-neutral-text mb-6">
          Resource Optimizer
        </h1>

        {/* Resource Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {resources.map((resource) => {
            const ResourceIcon = resource.icon
            const isSelected = selectedResource === resource.id
            return (
              <button
                key={resource.id}
                onClick={() => setSelectedResource(resource.id)}
                className={`card p-4 text-center transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                  }`}
              >
                <div className={`w-12 h-12 bg-${resource.color}-50 rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <ResourceIcon size={24} className={`text-${resource.color}-600`} />
                </div>
                <p className="text-xs font-medium text-neutral-text">{resource.name}</p>
                <p className="text-lg font-bold text-neutral-text mt-1">
                  {resource.current}{resource.unit}
                </p>
              </button>
            )
          })}
        </div>

        {/* Current Status */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-12 h-12 bg-${selectedResourceData.color}-50 rounded-full flex items-center justify-center mr-3`}>
                <Icon size={24} className={`text-${selectedResourceData.color}-600`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-text">
                  {selectedResourceData.name} Usage
                </h3>
                <p className="text-sm text-neutral-text-secondary">
                  Current vs Optimal
                </p>
              </div>
            </div>
            {selectedResourceData.status === 'warning' ? (
              <AlertCircle className="text-secondary-yellow" size={24} />
            ) : (
              <CheckCircle className="text-status-success" size={24} />
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-text-secondary">Current</span>
              <span className="font-semibold text-neutral-text">
                {selectedResourceData.current}{selectedResourceData.unit}
              </span>
            </div>
            <div className="w-full bg-neutral-bg rounded-full h-3 mb-2">
              <div
                className={`bg-${selectedResourceData.color}-600 h-3 rounded-full transition-all`}
                style={{ width: `${selectedResourceData.current}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-text-secondary">Optimal</span>
              <span className="font-semibold text-status-success">
                {selectedResourceData.optimal}{selectedResourceData.unit}
              </span>
            </div>
          </div>

          {/* Savings Potential */}
          <div className="bg-green-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-text-secondary mb-1">
                Potential Savings
              </p>
              <p className="text-2xl font-bold text-green-600">
                {selectedResourceData.savings}
              </p>
            </div>
            <TrendingDown className="text-green-600" size={32} />
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-text mb-4">
            AI Recommendations
          </h2>
          <div className="space-y-4">
            {recommendations[selectedResource].map((rec, index) => (
              <div key={index} className="card">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-neutral-text flex-1">
                    {rec.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${rec.priority === 'high'
                        ? 'bg-red-50 text-red-600'
                        : rec.priority === 'medium'
                          ? 'bg-yellow-50 text-yellow-600'
                          : 'bg-green-50 text-green-600'
                      }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-neutral-text-secondary mb-3">
                  {rec.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-primary">
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

export default ResourceOptimizer
