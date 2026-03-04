import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Phone, Lock, Mail } from 'lucide-react'
import appLogo from '../applogo.png'
import { setItem, STORAGE_KEYS } from '../utils/localStorage'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loginMode, setLoginMode] = useState('password') // 'password' or 'otp'
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    otp: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
    return phoneRegex.test(phone)
  }

  const validatePassword = (password) => {
    return password.length >= 6
  }

  const handlePasswordLogin = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number format'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Simulate login - in real app, validate against backend
    setItem(STORAGE_KEYS.AUTH_PHONE, formData.phone)
    setItem(STORAGE_KEYS.AUTH_TOKEN, 'user_' + Date.now())
    onLogin()
    navigate('/dashboard')
  }

  const handleSendOtp = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number format'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Simulate OTP sending
    setMessage('OTP sent to ' + formData.phone)
    setShowOtpInput(true)
    setErrors({})
  }

  const handleVerifyOtp = (e) => {
    e.preventDefault()

    if (!formData.otp.trim()) {
      setErrors({ otp: 'OTP is required' })
      return
    }

    if (formData.otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' })
      return
    }

    // Simulate OTP verification
    setItem(STORAGE_KEYS.AUTH_PHONE, formData.phone)
    setItem(STORAGE_KEYS.AUTH_TOKEN, 'user_' + Date.now())
    onLogin()
    navigate('/dashboard')
  }

  const handleGoogleLogin = () => {
    // Simulate Google login
    setMessage('Google login integration coming soon')
    // In real app, integrate with Google OAuth
    setItem(STORAGE_KEYS.AUTH_PHONE, 'google_user_' + Date.now())
    setItem(STORAGE_KEYS.AUTH_TOKEN, 'google_' + Date.now())
    onLogin()
    navigate('/dashboard')
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={appLogo} alt="KrishiSankalp" className="w-20 h-20 rounded-full object-cover" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-neutral-text text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-neutral-text-secondary text-center mb-8">
          Login to continue
        </p>

        {/* Message */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        {/* Login Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setLoginMode('password')
              setShowOtpInput(false)
              setErrors({})
              setMessage('')
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${loginMode === 'password'
                ? 'bg-primary text-white'
                : 'bg-neutral-bg text-neutral-text'
              }`}
          >
            Password
          </button>
          <button
            onClick={() => {
              setLoginMode('otp')
              setShowOtpInput(false)
              setErrors({})
              setMessage('')
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${loginMode === 'otp'
                ? 'bg-primary text-white'
                : 'bg-neutral-bg text-neutral-text'
              }`}
          >
            OTP
          </button>
        </div>

        {/* Password Login Form */}
        {loginMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {/* Phone Number */}
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
                  className={`input-field pl-12 ${errors.phone ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`input-field pl-12 pr-12 ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button type="submit" className="btn-primary w-full mt-6">
              Login
            </button>
          </form>
        )}

        {/* OTP Login Form */}
        {loginMode === 'otp' && (
          <form onSubmit={showOtpInput ? handleVerifyOtp : handleSendOtp} className="space-y-4">
            {/* Phone Number */}
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
                  disabled={showOtpInput}
                  className={`input-field pl-12 ${errors.phone ? 'border-red-500' : ''} ${showOtpInput ? 'bg-gray-100' : ''}`}
                  required
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* OTP Input */}
            {showOtpInput && (
              <div>
                <label className="block text-sm font-medium text-neutral-text mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.slice(0, 6) })}
                  maxLength="6"
                  className={`input-field text-center text-2xl tracking-widest ${errors.otp ? 'border-red-500' : ''}`}
                  required
                />
                {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
              </div>
            )}

            {/* Send/Verify Button */}
            <button type="submit" className="btn-primary w-full mt-6">
              {showOtpInput ? 'Verify OTP' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-neutral-divider"></div>
          <span className="px-3 text-neutral-text-secondary text-sm">Or</span>
          <div className="flex-1 border-t border-neutral-divider"></div>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-neutral-divider rounded-lg hover:bg-neutral-bg transition-colors"
        >
          <Mail size={20} className="text-primary" />
          <span className="font-medium text-neutral-text">Login with Gmail</span>
        </button>

        {/* Register Link */}
        <p className="text-center text-neutral-text-secondary mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-primary font-medium hover:underline"
          >
            Register
          </button>
        </p>

        {/* Language Selector */}
        <div className="mt-8">
          <select className="w-full input-field">
            <option>English</option>
            <option>हिंदी (Hindi)</option>
            <option>தமிழ் (Tamil)</option>
            <option>తెలుగు (Telugu)</option>
            <option>বাংলা (Bengali)</option>
            <option>मराठी (Marathi)</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default Login
