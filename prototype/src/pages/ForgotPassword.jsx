import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Lock } from 'lucide-react'
import appLogo from '../applogo.png'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState('phone') // 'phone', 'otp', 'password'
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
    return phoneRegex.test(phone)
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

    setMessage('OTP sent to ' + formData.phone)
    setStep('otp')
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

    setMessage('OTP verified successfully')
    setStep('password')
    setErrors({})
  }

  const handleResetPassword = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm password is required'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setMessage('Password reset successfully')
    setTimeout(() => {
      navigate('/login')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center text-primary font-medium mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Login
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={appLogo} alt="KrishiSankalp" className="w-20 h-20 rounded-full object-cover" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-neutral-text text-center mb-2">
          Reset Password
        </h1>
        <p className="text-neutral-text-secondary text-center mb-8">
          {step === 'phone' && 'Enter your phone number to reset password'}
          {step === 'otp' && 'Enter the OTP sent to your phone'}
          {step === 'password' && 'Create a new password'}
        </p>

        {/* Message */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        {/* Step 1: Phone Number */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
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

            <button type="submit" className="btn-primary w-full mt-6">
              Send OTP
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
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

            <button type="submit" className="btn-primary w-full mt-6">
              Verify OTP
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full py-3 text-primary font-medium"
            >
              Change Phone Number
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary" />
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className={`input-field pl-12 ${errors.newPassword ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-text mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`input-field pl-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" className="btn-primary w-full mt-6">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
