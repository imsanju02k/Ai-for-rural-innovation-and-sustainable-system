import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Lock, MapPin } from 'lucide-react'

const Register = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        language: 'en',
        agreedToTerms: false,
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        // Simulate registration
        navigate('/login')
    }

    const getPasswordStrength = (password) => {
        if (password.length === 0) return { strength: '', color: '' }
        if (password.length < 6) return { strength: 'Weak', color: 'text-red-600' }
        if (password.length < 10) return { strength: 'Medium', color: 'text-orange-600' }
        return { strength: 'Strong', color: 'text-green-600' }
    }

    const passwordStrength = getPasswordStrength(formData.password)

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-md mx-auto px-6 py-8">
                {/* Title */}
                <h1 className="text-3xl font-bold text-neutral-text mb-8">
                    Create Account
                </h1>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-text mb-2">
                            Full Name
                        </label>
                        <div className="relative">
                            <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary" />
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field pl-12"
                                required
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-text mb-2">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary" />
                            <input
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="input-field pl-12"
                                required
                            />
                        </div>
                    </div>

                    {/* Email (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-text mb-2">
                            Email <span className="text-neutral-text-secondary">(Optional)</span>
                        </label>
                        <div className="relative">
                            <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary" />
                            <input
                                type="email"
                                placeholder="your.email@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-field pl-12"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-text mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary" />
                            <input
                                type="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field pl-12"
                                required
                            />
                        </div>
                        {formData.password && (
                            <p className={`text-sm mt-1 ${passwordStrength.color}`}>
                                Strength: {passwordStrength.strength}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-text mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary" />
                            <input
                                type="password"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="input-field pl-12"
                                required
                            />
                        </div>
                    </div>

                    {/* Language Preference */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-text mb-2">
                            Language Preference
                        </label>
                        <select
                            value={formData.language}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            className="input-field"
                        >
                            <option value="en">English</option>
                            <option value="hi">हिंदी (Hindi)</option>
                            <option value="ta">தமிழ் (Tamil)</option>
                            <option value="te">తెలుగు (Telugu)</option>
                            <option value="bn">বাংলা (Bengali)</option>
                            <option value="mr">मराठी (Marathi)</option>
                        </select>
                    </div>

                    {/* Location Permission */}
                    <div className="card bg-blue-50 border border-blue-200">
                        <div className="flex items-start">
                            <MapPin size={20} className="text-blue-600 mr-3 mt-1" />
                            <div>
                                <h3 className="font-medium text-neutral-text mb-1">
                                    Location Permission
                                </h3>
                                <p className="text-sm text-neutral-text-secondary">
                                    Allow access to provide location-based services like weather and market prices
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={formData.agreedToTerms}
                            onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                            className="mt-1 mr-2"
                            required
                        />
                        <label htmlFor="terms" className="text-sm text-neutral-text-secondary">
                            I agree to the{' '}
                            <button type="button" className="text-primary hover:underline">
                                Terms & Conditions
                            </button>{' '}
                            and{' '}
                            <button type="button" className="text-primary hover:underline">
                                Privacy Policy
                            </button>
                        </label>
                    </div>

                    {/* Register Button */}
                    <button type="submit" className="btn-primary w-full mt-6">
                        Register
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-neutral-text-secondary mt-6">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-primary font-medium hover:underline"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    )
}

export default Register
