import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AlertProvider } from './contexts/AlertContext'

// Pages
import Splash from './pages/Splash'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import DiseaseDetection from './pages/DiseaseDetection'
import MarketPrices from './pages/MarketPrices'
import ResourceOptimizer from './pages/ResourceOptimizer'
import AdvisoryChat from './pages/AdvisoryChat'
import SensorMonitor from './pages/SensorMonitor'
import Alerts from './pages/Alerts'
import Community from './pages/Community'
import Profile from './pages/Profile'
import Achievements from './pages/Achievements'
import YieldPrediction from './pages/YieldPrediction'
import Settings from './pages/Settings'
import Farms from './pages/Farms'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AlertProvider>
          <Router>
          <Routes>
          <Route path="/" element={<Splash />} />
          <Route
            path="/onboarding"
            element={showOnboarding ? <Onboarding onComplete={() => setShowOnboarding(false)} /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/disease-detection"
            element={isAuthenticated ? <DiseaseDetection /> : <Navigate to="/login" />}
          />
          <Route
            path="/market-prices"
            element={isAuthenticated ? <MarketPrices /> : <Navigate to="/login" />}
          />
          <Route
            path="/resource-optimizer"
            element={isAuthenticated ? <ResourceOptimizer /> : <Navigate to="/login" />}
          />
          <Route
            path="/advisory"
            element={isAuthenticated ? <AdvisoryChat /> : <Navigate to="/login" />}
          />
          <Route
            path="/sensors"
            element={isAuthenticated ? <SensorMonitor /> : <Navigate to="/login" />}
          />
          <Route
            path="/alerts"
            element={isAuthenticated ? <Alerts /> : <Navigate to="/login" />}
          />
          <Route
            path="/community"
            element={isAuthenticated ? <Community /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/achievements"
            element={isAuthenticated ? <Achievements /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
          />
          <Route
            path="/yield-prediction"
            element={isAuthenticated ? <YieldPrediction /> : <Navigate to="/login" />}
          />
          <Route
            path="/farms"
            element={isAuthenticated ? <Farms /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
        </AlertProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
