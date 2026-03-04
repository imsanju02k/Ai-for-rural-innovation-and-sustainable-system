import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Phone, Lock, Mail, Loader } from 'lucide-react'
import appLogo from '../applogo.png'
import { setItem, STORAGE_KEYS } from '../utils/localStorage'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loginMode, setLoginMode] = useState('password') // 'password' or 'otp'
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    otp: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const validatePhone = (phone) => {
    // Accept Indian phone numbers and international formats
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
    return phoneRegex.test(phone.trim())
  }

  const validatePassword = (password) => {
    return password.trim().length >= 6
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    const newErrors = {}

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number format'
    }

    // Validate password
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // TODO: Replace with actual backend API call
      // Example: const response = await fetch('/api/auth/login', { ... })

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create user profile
      const userData = {
        name: 'Farmer User',
        phone: formData.phone,
        email: 'farmer@example.com',
        location: 'Bangalore, Karnataka',
        farmName: 'My Farm',
        farmSize: '5 acres',
        crops: ['Rice', 'Wheat'],
        photo: null,
        joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      }

      // Save user profile
      setItem(STORAGE_KEYS.USER_PROFILE, userData)
      setItem(STORAGE_KEYS.AUTH_PHONE, formData.phone)
      setItem(STORAGE_KEYS.AUTH_TOKEN, 'user_' + Date.now())

      setMessage('Login successful!')
      setTimeout(() => {
        onLogin()
        navigate('/dashboard')
      }, 500)
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' })
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOtp = async (e) => {
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

    setIsLoading(true)
    setErrors({})

    try {
      // TODO: Replace with actual OTP service (Twilio, AWS SNS, etc.)
      // Example: const response = await fetch('/api/auth/send-otp', { 
      //   method: 'POST',
      //   body: JSON.stringify({ phone: formData.phone })
      // })

      // Simulate OTP sending delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      setMessage('OTP sent to ' + formData.phone + '. Check your SMS.')
      setShowOtpInput(true)
    } catch (error) {
      setErrors({ general: 'Failed to send OTP. Please try again.' })
      console.error('OTP send error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()

    if (!formData.otp.trim()) {
      setErrors({ otp: 'OTP is required' })
      return
    }

    if (formData.otp.length !== 6 || !/^\d+$/.test(formData.otp)) {
      setErrors({ otp: 'OTP must be 6 digits' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // TODO: Replace with actual OTP verification API
      // Example: const response = await fetch('/api/auth/verify-otp', {
      //   method: 'POST',
      //   body: JSON.stringify({ phone: formData.phone, otp: formData.otp })
      // })

      // Simulate OTP verification delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create user profile
      const otpUserData = {
        name: 'Farmer User',
        phone: formData.phone,
        email: 'farmer@example.com',
        location: 'Bangalore, Karnataka',
        farmName: 'My Farm',
        farmSize: '5 acres',
        crops: ['Rice', 'Wheat'],
        photo: null,
        joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      }

      // Save user profile
      setItem(STORAGE_KEYS.USER_PROFILE, otpUserData)
      setItem(STORAGE_KEYS.AUTH_PHONE, formData.phone)
      setItem(STORAGE_KEYS.AUTH_TOKEN, 'user_' + Date.now())

      setMessage('OTP verified successfully!')
      setTimeout(() => {
        onLogin()
        navigate('/dashboard')
      }, 500)
    } catch (error) {
      setErrors({ otp: 'OTP verification failed. Please try again.' })
      console.error('OTP verification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrors({})

    try {
      // TODO: Replace with actual Google OAuth integration
      // Example using Google Sign-In library:
      // const result = await window.gapi.auth2.getAuthInstance().signIn()
      // const profile = result.getBasicProfile()

      // Or using OAuth 2.0 flow:
      // const response = await fetch('/api/auth/google', {
      //   method: 'POST',
      //   body: JSON.stringify({ idToken: googleIdToken })
      // })

      // Simulate Google login delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Create user profile
      const googleUserData = {
        name: 'Google User',
        phone: 'google_' + Date.now(),
        email: 'user@gmail.com',
        location: 'Bangalore, Karnataka',
        farmName: 'My Farm',
        farmSize: '5 acres',
        crops: ['Rice', 'Wheat'],
        photo: null,
        joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      }

      // Save user profile
      setItem(STORAGE_KEYS.USER_PROFILE, googleUserData)
      setItem(STORAGE_KEYS.AUTH_PHONE, googleUserData.phone)
      setItem(STORAGE_KEYS.AUTH_TOKEN, 'google_' + Date.now())

      setMessage('Logged in with Gmail successfully!')
      setTimeout(() => {
        onLogin()
        navigate('/dashboard')
      }, 500)
    } catch (error) {
      setErrors({ general: 'Gmail login failed. Please try again.' })
      console.error('Google login error:', error)
    } finally {
      setIsLoading(false)
    }
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

        {/* Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {errors.general}
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
            <button type="submit" className="btn-primary w-full mt-6 flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading && <Loader size={18} className="animate-spin" />}
              {isLoading ? 'Logging in...' : 'Login'}
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
            <button type="submit" className="btn-primary w-full mt-6 flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading && <Loader size={18} className="animate-spin" />}
              {isLoading ? (showOtpInput ? 'Verifying...' : 'Sending...') : (showOtpInput ? 'Verify OTP' : 'Send OTP')}
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
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-neutral-divider rounded-lg hover:bg-neutral-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader size={20} className="animate-spin text-primary" /> : <Mail size={20} className="text-primary" />}
          <span className="font-medium text-neutral-text">{isLoading ? 'Logging in...' : 'Login with Gmail'}</span>
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
