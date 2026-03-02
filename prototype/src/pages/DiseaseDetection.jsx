import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Image as ImageIcon, Upload } from 'lucide-react'

const DiseaseDetection = () => {
    const navigate = useNavigate()
    const [selectedCrop, setSelectedCrop] = useState('')
    const [selectedImage, setSelectedImage] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [result, setResult] = useState(null)

    const recentDetections = [
        {
            id: 1,
            disease: 'Rice Blast',
            confidence: 92,
            date: '2 days ago',
            image: '/placeholder-crop.jpg',
        },
        {
            id: 2,
            disease: 'Wheat Rust',
            confidence: 88,
            date: '5 days ago',
            image: '/placeholder-crop.jpg',
        },
        {
            id: 3,
            disease: 'No Disease',
            confidence: 95,
            date: '1 week ago',
            image: '/placeholder-crop.jpg',
        },
    ]

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setSelectedImage(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAnalyze = () => {
        if (!selectedImage || !selectedCrop) return

        setAnalyzing(true)
        // Simulate API call
        setTimeout(() => {
            setResult({
                disease: 'Rice Blast',
                confidence: 92,
                severity: 'High',
                treatments: [
                    {
                        name: 'Tricyclazole',
                        type: 'Chemical',
                        dosage: '0.6g per liter',
                        timing: 'Apply at tillering and booting stage',
                    },
                    {
                        name: 'Neem Oil',
                        type: 'Organic',
                        dosage: '5ml per liter',
                        timing: 'Spray every 7 days',
                    },
                ],
            })
            setAnalyzing(false)
        }, 2000)
    }

    if (result) {
        return (
            <div className="min-h-screen bg-neutral-bg">
                {/* Header */}
                <div className="bg-white border-b border-neutral-divider sticky top-0 z-10">
                    <div className="max-w-md mx-auto px-4 py-4 flex items-center">
                        <button onClick={() => setResult(null)} className="mr-4">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-xl font-semibold">Detection Results</h1>
                    </div>
                </div>

                <div className="max-w-md mx-auto px-4 py-6">
                    {/* Image */}
                    <img
                        src={selectedImage}
                        alt="Analyzed crop"
                        className="w-full h-64 object-cover rounded-lg mb-6"
                    />

                    {/* Disease Info */}
                    <div className="card mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-neutral-text">
                                {result.disease}
                            </h2>
                            <span className="badge badge-error">{result.severity} Severity</span>
                        </div>
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm text-neutral-text-secondary mb-2">
                                    Confidence Score
                                </p>
                                <p className="text-3xl font-bold text-status-success">
                                    {result.confidence}%
                                </p>
                            </div>
                            <div className="w-24 h-24">
                                <svg className="transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="none"
                                        stroke="#E0E0E0"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="none"
                                        stroke="#4CAF50"
                                        strokeWidth="8"
                                        strokeDasharray={`${result.confidence * 2.51} 251`}
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Disease Information */}
                    <div className="card mb-4">
                        <h3 className="font-semibold text-neutral-text mb-3">
                            Disease Information
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p className="text-neutral-text-secondary">
                                <span className="font-medium text-neutral-text">Symptoms:</span>{' '}
                                Brown spots on leaves, wilting, reduced growth
                            </p>
                            <p className="text-neutral-text-secondary">
                                <span className="font-medium text-neutral-text">Causes:</span>{' '}
                                Fungal infection, high humidity, poor drainage
                            </p>
                        </div>
                    </div>

                    {/* Treatment Recommendations */}
                    <div className="mb-4">
                        <h3 className="font-semibold text-neutral-text mb-3">
                            Treatment Recommendations
                        </h3>
                        <div className="space-y-3">
                            {result.treatments.map((treatment, index) => (
                                <div key={index} className="card">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-neutral-text">
                                            {treatment.name}
                                        </h4>
                                        <span className={`badge ${treatment.type === 'Chemical' ? 'badge-warning' : 'badge-success'
                                            }`}>
                                            {treatment.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-text-secondary mb-1">
                                        <span className="font-medium">Dosage:</span> {treatment.dosage}
                                    </p>
                                    <p className="text-sm text-neutral-text-secondary">
                                        <span className="font-medium">Timing:</span> {treatment.timing}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button className="btn-primary w-full">
                            Save to History
                        </button>
                        <button className="btn-secondary w-full">
                            Share with Expert
                        </button>
                        <button
                            onClick={() => navigate('/advisory')}
                            className="btn-secondary w-full"
                        >
                            Get More Help
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-bg">
            {/* Header */}
            <div className="bg-white border-b border-neutral-divider sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-4 flex items-center">
                    <button onClick={() => navigate('/dashboard')} className="mr-4">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-semibold">Detect Crop Disease</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6">
                {/* Camera Preview / Image Upload */}
                <div className="mb-6">
                    <div className="relative bg-neutral-surface rounded-lg overflow-hidden border-2 border-dashed border-neutral-divider h-80 flex items-center justify-center">
                        {selectedImage ? (
                            <img
                                src={selectedImage}
                                alt="Selected crop"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center">
                                <Camera size={64} className="mx-auto text-neutral-text-secondary mb-4" />
                                <p className="text-neutral-text-secondary">
                                    Take a photo or upload an image
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Upload Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <label className="btn-primary flex items-center justify-center cursor-pointer">
                            <Camera size={20} className="mr-2" />
                            Take Photo
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </label>
                        <label className="btn-secondary flex items-center justify-center cursor-pointer">
                            <ImageIcon size={20} className="mr-2" />
                            Gallery
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Crop Type Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-neutral-text mb-2">
                        Select Crop Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="input-field"
                        required
                    >
                        <option value="">Select crop type</option>
                        <option value="rice">Rice</option>
                        <option value="wheat">Wheat</option>
                        <option value="cotton">Cotton</option>
                        <option value="sugarcane">Sugarcane</option>
                        <option value="vegetables">Vegetables</option>
                    </select>
                </div>

                {/* Analyze Button */}
                <button
                    onClick={handleAnalyze}
                    disabled={!selectedImage || !selectedCrop || analyzing}
                    className="btn-primary w-full mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {analyzing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Upload size={20} className="mr-2" />
                            Analyze Image
                        </>
                    )}
                </button>

                {/* Recent Detections */}
                <div>
                    <h2 className="text-lg font-semibold text-neutral-text mb-4">
                        Recent Detections
                    </h2>
                    <div className="space-y-3">
                        {recentDetections.map((detection) => (
                            <div key={detection.id} className="card flex items-center">
                                <div className="w-16 h-16 bg-neutral-divider rounded-lg mr-4 flex-shrink-0"></div>
                                <div className="flex-1">
                                    <p className="font-medium text-neutral-text">
                                        {detection.disease}
                                    </p>
                                    <p className="text-sm text-neutral-text-secondary">
                                        {detection.date}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="badge badge-success">
                                        {detection.confidence}%
                                    </span>
                                    <button className="text-primary text-sm font-medium mt-2 block">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DiseaseDetection
