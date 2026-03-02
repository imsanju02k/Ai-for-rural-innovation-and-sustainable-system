# Complete Setup Guide - React Prototype

## 📦 Quick Start

### Step 1: Install Dependencies

```bash
cd Ai-for-rural-innovation-and-sustainable-system/prototype
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```
cd Ai-for-rural-innovation-and-sustainable-system/prototype
npm install

### Step 3: Open Browser

Navigate to `http://localhost:3000`

## 🎯 What's Included

### ✅ Completed Components

1. **Splash Screen** - Animated loading screen with logo
2. **Onboarding** - 3-screen onboarding flow with swipe navigation
3. **Login** - Phone/password authentication with validation
4. **Register** - Complete registration form with password strength indicator
5. **Dashboard** - Main hub with quick stats and action cards
6. **Disease Detection** - Full flow with image upload and results
7. **Header Component** - Location, notifications, online status
8. **Bottom Navigation** - 5-item navigation with active states

### 📝 Components to Create

Create these files in `src/pages/` directory:

#### MarketPrices.jsx
```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, MapPin } from 'lucide-react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

const MarketPrices = () => {
  const navigate = useNavigate()
  const [selectedCrop, setSelectedCrop] = useState('rice')
  
  const prices = [
    { market: 'Delhi Mandi', distance: '12 km', price: 2550, grade: 'A', trend: '+12%' },
    { market: 'Gurgaon Market', distance: '25 km', price: 2480, grade: 'A', trend: '+8%' },
  ]

  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      <Header />
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Market Prices</h1>
        {/* Add your market prices UI here */}
      </div>
      <BottomNav />
    </div>
  )
}

export default MarketPrices
```

#### ResourceOptimizer.jsx
```jsx
import { useNavigate } from 'react-router-dom'
import { Droplet, Leaf } from 'lucide-react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

const ResourceOptimizer = () => {
  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      <Header />
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Resource Optimizer</h1>
        {/* Add irrigation and fertilizer recommendations */}
      </div>
      <BottomNav />
    </div>
  )
}

export default ResourceOptimizer
```

#### AdvisoryChat.jsx
```jsx
import { useState } from 'react'
import { Send, Mic } from 'lucide-react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

const AdvisoryChat = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      <Header />
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Ask Advisor</h1>
        {/* Add chat interface */}
      </div>
      <BottomNav />
    </div>
  )
}

export default AdvisoryChat
```

#### SensorMonitor.jsx
```jsx
import { Activity, Droplets, Thermometer } from 'lucide-react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

const SensorMonitor = () => {
  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      <Header />
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Sensor Monitor</h1>
        {/* Add sensor data visualization */}
      </div>
      <BottomNav />
    </div>
  )
}

export default SensorMonitor
```

#### Alerts.jsx
```jsx
import { Bell, AlertTriangle } from 'lucide-react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

const Alerts = () => {
  const alerts = [
    { type: 'weather', title: 'Heavy Rainfall Alert', time: '2h ago', priority: 'high' },
    { type: 'price', title: 'Price Alert: Rice', time: '5h ago', priority: 'medium' },
  ]

  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      <Header />
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Alerts</h1>
        {/* Add alerts list */}
      </div>
      <BottomNav />
    </div>
  )
}

export default Alerts
```

#### Community.jsx
```jsx
import { Users, Plus } from 'lucide-react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

const Community = () => {
  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      <Header />
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Community</h1>
        {/* Add community posts */}
      </div>
      <BottomNav />
    </div>
  )
}

export default Community
```

#### Profile.jsx
```jsx
import { User, Settings, LogOut } from 'lucide-react'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

const Profile = () => {
  return (
    <div className="min-h-screen bg-neutral-bg pb-20">
      <Header />
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        {/* Add profile information */}
      </div>
      <BottomNav />
    </div>
  )
}

export default Profile
```

## 🎨 Tailwind CSS Classes Reference

### Buttons
```jsx
<button className="btn-primary">Primary Button</button>
<button className="btn-secondary">Secondary Button</button>
```

### Cards
```jsx
<div className="card">Basic Card</div>
<div className="card card-hover">Hoverable Card</div>
```

### Inputs
```jsx
<input className="input-field" placeholder="Enter text" />
```

### Badges
```jsx
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-error">Error</span>
<span className="badge badge-info">Info</span>
```

### Layout
```jsx
<div className="min-h-screen bg-neutral-bg pb-20">
  {/* Content with bottom nav spacing */}
</div>
```

## 🔧 Customization

### Change Colors

Edit `tailwind.config.js`:

```js
colors: {
  primary: {
    DEFAULT: '#2E7D32',  // Your primary color
    dark: '#1B5E20',
    light: '#4CAF50',
  },
}
```

### Add New Icons

```bash
npm install lucide-react
```

```jsx
import { IconName } from 'lucide-react'
<IconName size={24} />
```

### Add Charts

```bash
npm install recharts
```

```jsx
import { LineChart, Line, XAxis, YAxis } from 'recharts'
```

## 📱 Mobile Testing

### Using Browser DevTools
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device (iPhone X, Pixel 5, etc.)
4. Test responsive design

### Using Real Device
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Access from mobile: `http://YOUR_IP:3000`
3. Ensure both devices on same network

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- --port 3001
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tailwind Styles Not Working
```bash
# Rebuild Tailwind
npm run build
npm run dev
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

## 📚 Additional Resources

- [React Hooks Guide](https://react.dev/reference/react)
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)
- [Lucide Icons Gallery](https://lucide.dev/icons/)
- [Vite Configuration](https://vitejs.dev/config/)

## ✅ Checklist

- [ ] Install Node.js 18+
- [ ] Clone/download project
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000`
- [ ] Test all flows
- [ ] Create remaining page components
- [ ] Customize colors and branding
- [ ] Add real API integration
- [ ] Test on mobile devices
- [ ] Build for production
- [ ] Deploy to hosting

---

**Need help? Check the main README.md or project documentation!**
