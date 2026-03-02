import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Sprout, Plus, Edit, Trash2 } from 'lucide-react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { useTheme } from '../contexts/ThemeContext'

const Farms = () => {
    const navigate = useNavigate()
    const { isDark } = useTheme()
    const [farms, setFarms] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulate API call to fetch farms
        setTimeout(() => {
            setFarms([
                {
                    id: 1,
                    name: 'Main Farm',
                    location: 'Bangalore, Karnataka',
                    size: 5.5,
                    unit: 'acres',
                    crops: ['Rice', 'Wheat', 'Vegetables'],
                    status: 'Active',
                },
                {
                    id: 2,
                    name: 'North Field',
                    location: 'Mysore, Karnataka',
                    size: 3.2,
                    unit: 'acres',
                    crops: ['Cotton', 'Sugarcane'],
                    status: 'Active',
                },
                {
                    id: 3,
                    name: 'East Plot',
                    location: 'Hubli, Karnataka',
                    size: 2.8,
                    unit: 'acres',
                    crops: ['Wheat', 'Pulses'],
                    status: 'Inactive',
                },
            ])
            setLoading(false)
        }, 1000)
    }, [])

    const handleAddFarm = () => {
        // Navigate to add farm page (to be implemented)
        alert('Add Farm feature coming soon!')
    }

    const handleEditFarm = (farmId) => {
        // Navigate to edit farm page (to be implemented)
        alert(`Edit Farm ${farmId} feature coming soon!`)
    }

    const handleDeleteFarm = (farmId) => {
        if (confirm('Are you sure you want to delete this farm?')) {
            setFarms(farms.filter(farm => farm.id !== farmId))
        }
    }

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-neutral-bg'}`}>
                <Header />
                <div className="max-w-md mx-auto px-4 py-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
                <BottomNav />
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-neutral-bg'}`}>
            {/* Header */}
            <div className={`${isDark ? 'bg-dark-surface border-dark-divider' : 'bg-white border-neutral-divider'} border-b sticky top-0 z-10`}>
                <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => navigate('/dashboard')} className="mr-4">
                            <ArrowLeft size={24} className={isDark ? 'text-dark-text' : 'text-neutral-text'} />
                        </button>
                        <h1 className={`text-xl font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                            My Farms
                        </h1>
                    </div>
                    <button
                        onClick={handleAddFarm}
                        className="btn-primary flex items-center px-4 py-2"
                    >
                        <Plus size={20} className="mr-1" />
                        Add Farm
                    </button>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6 pb-24">
                {/* Summary Card */}
                <div className={`${isDark ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-4 mb-6 shadow-sm`}>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'} mb-4`}>
                        Farm Summary
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-dark-primary' : 'text-primary'}`}>
                                {farms.length}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                Total Farms
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-dark-primary' : 'text-primary'}`}>
                                {farms.reduce((sum, farm) => sum + farm.size, 0).toFixed(1)}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                Total Acres
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-dark-primary' : 'text-primary'}`}>
                                {farms.filter(f => f.status === 'Active').length}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                Active
                            </p>
                        </div>
                    </div>
                </div>

                {/* Farms List */}
                {farms.length === 0 ? (
                    <div className={`${isDark ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-8 text-center`}>
                        <Sprout size={64} className={`mx-auto mb-4 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`} />
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'} mb-2`}>
                            No Farms Yet
                        </h3>
                        <p className={`${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'} mb-4`}>
                            Add your first farm to get started
                        </p>
                        <button onClick={handleAddFarm} className="btn-primary">
                            <Plus size={20} className="mr-2" />
                            Add Your First Farm
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {farms.map((farm) => (
                            <div
                                key={farm.id}
                                className={`${isDark ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-4 shadow-sm`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'} mb-1`}>
                                            {farm.name}
                                        </h3>
                                        <div className={`flex items-center ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'} text-sm mb-2`}>
                                            <MapPin size={16} className="mr-1" />
                                            {farm.location}
                                        </div>
                                    </div>
                                    <span className={`badge ${farm.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
                                        {farm.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                            Farm Size
                                        </p>
                                        <p className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                            {farm.size} {farm.unit}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                            Crops
                                        </p>
                                        <p className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                            {farm.crops.length}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'} mb-2`}>
                                        Growing Crops:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {farm.crops.map((crop, index) => (
                                            <span
                                                key={index}
                                                className={`px-3 py-1 ${isDark ? 'bg-dark-bg text-dark-text' : 'bg-neutral-bg text-neutral-text'} rounded-full text-sm`}
                                            >
                                                {crop}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditFarm(farm.id)}
                                        className="btn-secondary flex-1 flex items-center justify-center"
                                    >
                                        <Edit size={16} className="mr-2" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteFarm(farm.id)}
                                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg ${
                                            isDark 
                                                ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' 
                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                    >
                                        <Trash2 size={16} className="mr-2" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    )
}

export default Farms
