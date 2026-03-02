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
        
        // Disease database by crop type
        const diseaseDatabase = {
            rice: [
                {
                    disease: 'Rice Blast',
                    confidence: 92,
                    severity: 'High',
                    symptoms: 'Brown spots on leaves, wilting, reduced growth',
                    causes: 'Fungal infection, high humidity, poor drainage',
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
                },
                {
                    disease: 'Brown Spot',
                    confidence: 88,
                    severity: 'Medium',
                    symptoms: 'Circular brown spots on leaves, yellowing',
                    causes: 'Fungal pathogen, nutrient deficiency',
                    treatments: [
                        {
                            name: 'Mancozeb',
                            type: 'Chemical',
                            dosage: '2g per liter',
                            timing: 'Spray at 10-day intervals',
                        },
                        {
                            name: 'Balanced Fertilizer',
                            type: 'Organic',
                            dosage: 'As per soil test',
                            timing: 'Apply during land preparation',
                        },
                    ],
                },
            ],
            wheat: [
                {
                    disease: 'Wheat Rust',
                    confidence: 90,
                    severity: 'High',
                    symptoms: 'Orange-red pustules on leaves and stems',
                    causes: 'Fungal infection, favorable weather conditions',
                    treatments: [
                        {
                            name: 'Propiconazole',
                            type: 'Chemical',
                            dosage: '1ml per liter',
                            timing: 'Apply at first sign of disease',
                        },
                        {
                            name: 'Sulfur Dust',
                            type: 'Organic',
                            dosage: '3kg per acre',
                            timing: 'Dust early morning',
                        },
                    ],
                },
                {
                    disease: 'Powdery Mildew',
                    confidence: 85,
                    severity: 'Medium',
                    symptoms: 'White powdery coating on leaves',
                    causes: 'Fungal infection, high humidity',
                    treatments: [
                        {
                            name: 'Sulfur Fungicide',
                            type: 'Chemical',
                            dosage: '2g per liter',
                            timing: 'Spray at 15-day intervals',
                        },
                        {
                            name: 'Milk Spray',
                            type: 'Organic',
                            dosage: '1:10 milk to water ratio',
                            timing: 'Spray weekly',
                        },
                    ],
                },
            ],
            cotton: [
                {
                    disease: 'Cotton Leaf Curl',
                    confidence: 93,
                    severity: 'High',
                    symptoms: 'Leaf curling, vein thickening, stunted growth',
                    causes: 'Viral infection transmitted by whiteflies',
                    treatments: [
                        {
                            name: 'Imidacloprid',
                            type: 'Chemical',
                            dosage: '0.5ml per liter',
                            timing: 'Control whitefly vectors',
                        },
                        {
                            name: 'Remove Infected Plants',
                            type: 'Organic',
                            dosage: 'N/A',
                            timing: 'Immediately upon detection',
                        },
                    ],
                },
                {
                    disease: 'Bacterial Blight',
                    confidence: 87,
                    severity: 'Medium',
                    symptoms: 'Water-soaked lesions, angular leaf spots',
                    causes: 'Bacterial infection, high moisture',
                    treatments: [
                        {
                            name: 'Copper Oxychloride',
                            type: 'Chemical',
                            dosage: '3g per liter',
                            timing: 'Spray at 10-day intervals',
                        },
                        {
                            name: 'Bordeaux Mixture',
                            type: 'Organic',
                            dosage: '1% solution',
                            timing: 'Spray preventively',
                        },
                    ],
                },
            ],
            sugarcane: [
                {
                    disease: 'Red Rot',
                    confidence: 91,
                    severity: 'High',
                    symptoms: 'Reddening of internal tissues, wilting',
                    causes: 'Fungal infection, waterlogging',
                    treatments: [
                        {
                            name: 'Carbendazim',
                            type: 'Chemical',
                            dosage: '1g per liter',
                            timing: 'Sett treatment before planting',
                        },
                        {
                            name: 'Hot Water Treatment',
                            type: 'Organic',
                            dosage: '52°C for 30 minutes',
                            timing: 'Treat setts before planting',
                        },
                    ],
                },
                {
                    disease: 'Smut',
                    confidence: 86,
                    severity: 'Medium',
                    symptoms: 'Black whip-like structure from growing point',
                    causes: 'Fungal infection through soil',
                    treatments: [
                        {
                            name: 'Propiconazole',
                            type: 'Chemical',
                            dosage: '1ml per liter',
                            timing: 'Spray at early stage',
                        },
                        {
                            name: 'Remove Infected Shoots',
                            type: 'Organic',
                            dosage: 'N/A',
                            timing: 'Before spore release',
                        },
                    ],
                },
            ],
            vegetables: [
                {
                    disease: 'Early Blight',
                    confidence: 89,
                    severity: 'Medium',
                    symptoms: 'Dark concentric rings on leaves, yellowing',
                    causes: 'Fungal infection, warm humid weather',
                    treatments: [
                        {
                            name: 'Chlorothalonil',
                            type: 'Chemical',
                            dosage: '2g per liter',
                            timing: 'Spray at 7-10 day intervals',
                        },
                        {
                            name: 'Baking Soda Spray',
                            type: 'Organic',
                            dosage: '1 tablespoon per liter',
                            timing: 'Spray weekly',
                        },
                    ],
                },
                {
                    disease: 'Powdery Mildew',
                    confidence: 84,
                    severity: 'Low',
                    symptoms: 'White powdery growth on leaves',
                    causes: 'Fungal infection, dry conditions',
                    treatments: [
                        {
                            name: 'Sulfur Fungicide',
                            type: 'Chemical',
                            dosage: '2g per liter',
                            timing: 'Spray at first sign',
                        },
                        {
                            name: 'Neem Oil',
                            type: 'Organic',
                            dosage: '5ml per liter',
                            timing: 'Spray every 7 days',
                        },
                    ],
                },
            ],
        };

        // Simulate API call with crop-specific disease detection
        setTimeout(() => {
            const cropDiseases = diseaseDatabase[selectedCrop] || diseaseDatabase.rice;
            // Randomly select a disease from the crop's disease list
            const randomDisease = cropDiseases[Math.floor(Math.random() * cropDiseases.length)];
            
            setResult(randomDisease);
            setAnalyzing(false);
        }, 2000);
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
                                {result.symptoms}
                            </p>
                            <p className="text-neutral-text-secondary">
                                <span className="font-medium text-neutral-text">Causes:</span>{' '}
                                {result.causes}
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
