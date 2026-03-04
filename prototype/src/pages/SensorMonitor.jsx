import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { Thermometer, Droplets, Wind, Sun, Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

const SensorMonitor = () => {
  // Color mapping for dynamic classes (Tailwind requires static class names)
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-600' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', bar: 'bg-cyan-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', bar: 'bg-yellow-600' },
  }
  const [sensors, setSensors] = useState([
    {
      id: 1,
      name: 'Soil Moisture',
      icon: Droplets,
      value: 68,
      unit: '%',
      status: 'good',
      location: 'Field A - Zone 1',
      lastUpdate: '2 mins ago',
      trend: 'stable',
      color: 'blue',
      history: [65, 66, 67, 68, 68, 67, 68],
    },
    {
      id: 2,
      name: 'Temperature',
      icon: Thermometer,
      value: 32,
      unit: '°C',
      status: 'warning',
      location: 'Field A - Zone 1',
      lastUpdate: '2 mins ago',
      trend: 'up',
      color: 'orange',
      history: [28, 29, 30, 31, 31, 32, 32],
    },
    {
      id: 3,
      name: 'Humidity',
      icon: Wind,
      value: 75,
      unit: '%',
      status: 'good',
      location: 'Field A - Zone 1',
      lastUpdate: '2 mins ago',
      trend: 'down',
      color: 'cyan',
      history: [78, 77, 76, 76, 75, 75, 75],
    },
    {
      id: 4,
      name: 'Light Intensity',
      icon: Sun,
      value: 850,
      unit: 'lux',
      status: 'good',
      location: 'Field A - Zone 1',
      lastUpdate: '2 mins ago',
      trend: 'up',
      color: 'yellow',
      history: [750, 780, 800, 820, 830, 840, 850],
    },
  ])

  const [selectedSensor, setSelectedSensor] = useState(sensors[0])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prevSensors =>
        prevSensors.map(sensor => ({
          ...sensor,
          value: sensor.value + (Math.random() - 0.5) * 2,
          lastUpdate: 'Just now',
        }))
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'text-status-success bg-green-50'
      case 'warning':
        return 'text-secondary-yellow bg-yellow-50'
      case 'critical':
        return 'text-status-error bg-red-50'
      default:
        return 'text-neutral-text-secondary bg-neutral-bg'
    }
  }

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp size={16} className="text-orange-600" />
    if (trend === 'down') return <TrendingUp size={16} className="text-blue-600 rotate-180" />
    return <Activity size={16} className="text-neutral-text-secondary" />
  }

  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      <Header showBack={true} title="IoT Sensor Monitor" />

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-text">
            IoT Sensor Monitor
          </h1>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-status-success rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-neutral-text-secondary">Live</span>
          </div>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {sensors.map((sensor) => {
            const Icon = sensor.icon
            const isSelected = selectedSensor.id === sensor.id
            return (
              <button
                key={sensor.id}
                onClick={() => setSelectedSensor(sensor)}
                className={`card p-4 text-left transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${colorMap[sensor.color].bg} rounded-full flex items-center justify-center`}>
                    <Icon size={20} className={colorMap[sensor.color].text} />
                  </div>
                  {getTrendIcon(sensor.trend)}
                </div>
                <p className="text-sm text-neutral-text-secondary mb-1">
                  {sensor.name}
                </p>
                <p className="text-2xl font-bold text-neutral-text">
                  {Math.round(sensor.value)}{sensor.unit}
                </p>
                <div className="flex items-center mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      sensor.status
                    )}`}
                  >
                    {sensor.status}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Sensor Details */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {React.createElement(selectedSensor.icon, {
                size: 24,
                className: `${colorMap[selectedSensor.color].text} mr-3`,
              })}
              <div>
                <h3 className="text-lg font-semibold text-neutral-text">
                  {selectedSensor.name}
                </h3>
                <p className="text-sm text-neutral-text-secondary">
                  {selectedSensor.location}
                </p>
              </div>
            </div>
            {selectedSensor.status === 'good' ? (
              <CheckCircle className="text-status-success" size={24} />
            ) : (
              <AlertTriangle className="text-secondary-yellow" size={24} />
            )}
          </div>

          {/* Current Reading */}
          <div className="bg-neutral-bg rounded-lg p-4 mb-4">
            <p className="text-sm text-neutral-text-secondary mb-2">
              Current Reading
            </p>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-neutral-text">
                {Math.round(selectedSensor.value)}
              </span>
              <span className="text-xl text-neutral-text-secondary ml-2">
                {selectedSensor.unit}
              </span>
            </div>
            <p className="text-xs text-neutral-text-secondary mt-2">
              Updated {selectedSensor.lastUpdate}
            </p>
          </div>

          {/* Mini Chart */}
          <div>
            <p className="text-sm font-medium text-neutral-text mb-3">
              Last 7 Readings
            </p>
            <div className="flex items-end justify-between h-24">
              {selectedSensor.history.map((value, index) => {
                const maxValue = Math.max(...selectedSensor.history)
                const height = (value / maxValue) * 100
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full mx-1 ${colorMap[selectedSensor.color].bar} rounded-t transition-all`}
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-neutral-text-secondary mt-2">
                      {index + 1}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-text mb-4">
            Recent Alerts
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <AlertTriangle className="text-secondary-yellow mr-3 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-neutral-text">
                  High Temperature Alert
                </p>
                <p className="text-xs text-neutral-text-secondary mt-1">
                  Temperature exceeded 30°C threshold - 15 mins ago
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="text-status-success mr-3 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-neutral-text">
                  Soil Moisture Optimal
                </p>
                <p className="text-xs text-neutral-text-secondary mt-1">
                  Moisture levels returned to normal - 1 hour ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default SensorMonitor
