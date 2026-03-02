import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, Eye, EyeOff, Phone, Lock } from 'lucide-react'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulate login
    onLogin()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 py-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <Leaf size={40} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-neutral-text text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-neutral-text-secondary text-center mb-8">
          Login to continue
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="input-field pl-12"
                required
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
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field pl-12 pr-12"
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
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-secondary hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button type="submit" className="btn-primary w-full mt-6">
            Login
          </button>
        </form>

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
