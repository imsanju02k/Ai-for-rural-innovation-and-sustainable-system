import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Sprout, Plus, Edit, Trash2, X, Save } from 'lucide-react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage'

const Farms = () => {
    const navigate = useNavigate()
    const { isDark } = useTheme()
    const { t } = useLanguage()
    const [farms, setFarms] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        size: '',
        unit: 'acres',
        crops: '',
        status: 'Active',
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        // Load farms from localStorage or use defaults
        const savedFarms = getItem(STORAGE_KEYS.USER_FARMS, null)
        if (savedFarms) {
            setFarms(savedFarms)
        } else {
            const defaultFarms = [
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
            ]
            setFarms(defaultFarms)
            setItem(STORAGE_KEYS.USER_FARMS, defaultFarms)
        }
        setLoading(false)
    }, [])

    const validateForm = () => {
        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = t('nameRequired')
        if (!formData.location.trim()) newErrors.location = t('locationRequired')
        if (!formData.size || isNaN(formData.size)) newErrors.size = t('validFarmSizeRequired')
        if (!formData.crops.trim()) newErrors.crops = t('atLeastOneCropRequired')
        return newErrors
    }

    const handleAddFarm = () => {
        setEditingId(null)
        setFormData({
            name: '',
            location: '',
            size: '',
            unit: 'acres',
            crops: '',
            status: 'Active',
        })
        setErrors({})
        setShowModal(true)
    }

    const handleEditFarm = (farm) => {
        setEditingId(farm.id)
        setFormData({
            name: farm.name,
            location: farm.location,
            size: farm.size,
            unit: farm.unit,
            crops: farm.crops.join(', '),
            status: farm.status,
        })
        setErrors({})
        setShowModal(true)
    }

    const handleDeleteFarm = (farmId) => {
        if (confirm(t('deleteConfirmation'))) {
            const updatedFarms = farms.filter(farm => farm.id !== farmId)
            setFarms(updatedFarms)
            setItem(STORAGE_KEYS.USER_FARMS, updatedFarms)
        }
    }

    const handleSaveFarm = () => {
        const newErrors = validateForm()
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const cropArray = formData.crops.split(',').map(c => c.trim()).filter(c => c)

        if (editingId) {
            // Update existing farm
            const updatedFarms = farms.map(farm =>
                farm.id === editingId
                    ? {
                        ...farm,
                        name: formData.name,
                        location: formData.location,
                        size: parseFloat(formData.size),
                        unit: formData.unit,
                        crops: cropArray,
                        status: formData.status,
                    }
                    : farm
            )
            setFarms(updatedFarms)
            setItem(STORAGE_KEYS.USER_FARMS, updatedFarms)
        } else {
            // Add new farm
            const newFarm = {
                id: Math.max(...farms.map(f => f.id), 0) + 1,
                name: formData.name,
                location: formData.location,
                size: parseFloat(formData.size),
                unit: formData.unit,
                crops: cropArray,
                status: formData.status,
            }
            const updatedFarms = [...farms, newFarm]
            setFarms(updatedFarms)
            setItem(STORAGE_KEYS.USER_FARMS, updatedFarms)
        }

        setShowModal(false)
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
                            {t('myFarms')}
                        </h1>
                    </div>
                    <button
                        onClick={handleAddFarm}
                        className="btn-primary flex items-center px-4 py-2"
                    >
                        <Plus size={20} className="mr-1" />
                        {t('addFarm')}
                    </button>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6 pb-24">
                {/* Summary Card */}
                <div className={`${isDark ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-4 mb-6 shadow-sm`}>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'} mb-4`}>
                        {t('farmSummary')}
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-dark-primary' : 'text-primary'}`}>
                                {farms.length}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                {t('totalFarms')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-dark-primary' : 'text-primary'}`}>
                                {farms.reduce((sum, farm) => sum + farm.size, 0).toFixed(1)}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                {t('totalAcres')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-bold ${isDark ? 'text-dark-primary' : 'text-primary'}`}>
                                {farms.filter(f => f.status === 'Active').length}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                {t('active')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Farms List */}
                {farms.length === 0 ? (
                    <div className={`${isDark ? 'bg-dark-surface' : 'bg-white'} rounded-lg p-8 text-center`}>
                        <Sprout size={64} className={`mx-auto mb-4 ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`} />
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'} mb-2`}>
                            {t('noFarmsYet')}
                        </h3>
                        <p className={`${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'} mb-4`}>
                            {t('addYourFirstFarm')}
                        </p>
                        <button onClick={handleAddFarm} className="btn-primary">
                            <Plus size={20} className="mr-2" />
                            {t('addFarm')}
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
                                            {t('farmSize')}
                                        </p>
                                        <p className={`text-lg font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                            {farm.size} {farm.unit}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-neutral-text-secondary'}`}>
                                            {t('crops')}
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
                                        onClick={() => handleEditFarm(farm)}
                                        className="btn-secondary flex-1 flex items-center justify-center"
                                    >
                                        <Edit size={16} className="mr-2" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteFarm(farm.id)}
                                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg ${isDark
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

            {/* Add/Edit Farm Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end z-50">
                    <div className={`w-full ${isDark ? 'bg-dark-surface' : 'bg-white'} rounded-t-2xl max-h-[95vh] overflow-y-auto flex flex-col`}>
                        <div className="sticky top-0 flex items-center justify-between p-6 border-b ${isDark ? 'border-dark-divider' : 'border-neutral-divider'}">
                            <h2 className={`text-xl font-semibold ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                {editingId ? t('editFarm') : t('addNewFarm')}
                            </h2>
                            <button onClick={() => setShowModal(false)}>
                                <X size={24} className={isDark ? 'text-dark-text' : 'text-neutral-text'} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                {/* Farm Name */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                        Farm Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${errors.name ? 'border-red-500' : isDark ? 'border-dark-divider' : 'border-neutral-divider'
                                            } ${isDark ? 'bg-dark-bg text-dark-text' : 'bg-white text-neutral-text'}`}
                                        placeholder="e.g., Main Farm"
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                </div>

                                {/* Location */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${errors.location ? 'border-red-500' : isDark ? 'border-dark-divider' : 'border-neutral-divider'
                                            } ${isDark ? 'bg-dark-bg text-dark-text' : 'bg-white text-neutral-text'}`}
                                        placeholder="e.g., Bangalore, Karnataka"
                                    />
                                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                                </div>

                                {/* Farm Size */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                            Farm Size
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.size}
                                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                            className={`w-full px-4 py-2 rounded-lg border ${errors.size ? 'border-red-500' : isDark ? 'border-dark-divider' : 'border-neutral-divider'
                                                } ${isDark ? 'bg-dark-bg text-dark-text' : 'bg-white text-neutral-text'}`}
                                            placeholder="5.5"
                                            step="0.1"
                                        />
                                        {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                            Unit
                                        </label>
                                        <select
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'border-dark-divider bg-dark-bg text-dark-text' : 'border-neutral-divider bg-white text-neutral-text'}`}
                                        >
                                            <option>acres</option>
                                            <option>hectares</option>
                                            <option>sq.m</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Crops */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                        Crops (comma-separated)
                                    </label>
                                    <textarea
                                        value={formData.crops}
                                        onChange={(e) => setFormData({ ...formData, crops: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${errors.crops ? 'border-red-500' : isDark ? 'border-dark-divider' : 'border-neutral-divider'
                                            } ${isDark ? 'bg-dark-bg text-dark-text' : 'bg-white text-neutral-text'}`}
                                        placeholder="e.g., Rice, Wheat, Vegetables"
                                        rows="3"
                                    />
                                    {errors.crops && <p className="text-red-500 text-sm mt-1">{errors.crops}</p>}
                                </div>

                                {/* Status */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-text' : 'text-neutral-text'}`}>
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'border-dark-divider bg-dark-bg text-dark-text' : 'border-neutral-divider bg-white text-neutral-text'}`}
                                    >
                                        <option>Active</option>
                                        <option>Inactive</option>
                                    </select>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4 w-full">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className={`flex-1 px-4 py-3 rounded-lg font-medium ${isDark ? 'bg-dark-bg text-dark-text hover:bg-dark-bg/80' : 'bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveFarm}
                                        className="flex-1 btn-primary flex items-center justify-center font-medium"
                                    >
                                        <Save size={16} className="mr-2" />
                                        {editingId ? 'Update Farm' : 'Add Farm'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={`sticky bottom-0 flex gap-3 p-6 border-t ${isDark ? 'bg-dark-surface border-dark-divider' : 'bg-white border-neutral-divider'}`}>
                            <button
                                onClick={() => setShowModal(false)}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium ${isDark ? 'bg-dark-bg text-dark-text hover:bg-dark-bg/80' : 'bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveFarm}
                                className="flex-1 btn-primary flex items-center justify-center font-medium"
                            >
                                <Save size={16} className="mr-2" />
                                {editingId ? 'Update Farm' : 'Add Farm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Farms
