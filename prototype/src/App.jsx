import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'

// Pages
import Splash from './pages/Splash'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DiseaseDetection from './pages/DiseaseDetection'
import MarketPrices from './pages/MarketPrices'
import ResourceOptimizer from './pages/ResourceOptimizer'
import AdvisoryChat from './pages/AdvisoryChat'
import SensorMonitor from './pages/SensorMonitor'
import Alerts from './pages/Alerts'
import Community from './pages/Community'
import Profile from './pages/Profile'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route 
          path="/onboarding" 
          element={showOnboarding ? <Onboarding onComplete={() => setShowOnboarding(false)} /> : <Navigate to="/login" />} 
        />
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        <Route path="/register" element={<Register />} />
        
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
      </Routes>
    </Router>
  )
}

export default App
