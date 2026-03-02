# KrishiSankalp AI - Prototype Architecture

## Overview
This is a React-based progressive web application prototype for KrishiSankalp AI, an agricultural platform designed for rural farmers in India.

## Architecture Layers

### 1. Frontend Layer (React + Vite)

#### Pages (17 total)
**Authentication Flow:**
- `Splash.jsx` - Initial loading screen
- `Onboarding.jsx` - First-time user introduction
- `Login.jsx` - User authentication
- `Register.jsx` - New user registration

**Main Application:**
- `Dashboard.jsx` - Central hub with quick actions
- `Farms.jsx` - Farm management (add, edit, delete farms)
- `SensorMonitor.jsx` - Real-time IoT sensor data
- `DiseaseDetection.jsx` - AI-powered crop disease detection
- `MarketPrices.jsx` - Real-time market price tracking
- `ResourceOptimizer.jsx` - Resource optimization recommendations
- `AdvisoryChat.jsx` - AI-powered agricultural advisory
- `YieldPrediction.jsx` - Crop yield forecasting
- `Alerts.jsx` - Notifications and alerts
- `Community.jsx` - Farmer community forum
- `Profile.jsx` - User profile management
- `Settings.jsx` - App settings and preferences

#### Components (Reusable)
- `Header.jsx` - Top navigation bar
- `BottomNav.jsx` - Bottom navigation menu
- `ActionCard.jsx` - Dashboard action cards
- `StatCard.jsx` - Statistics display cards

#### Contexts
- `ThemeContext.jsx` - Dark/Light mode management

#### Routing
- React Router DOM (BrowserRouter)
- Protected routes with authentication check
- Automatic redirect to login for unauthenticated users

#### State Management
- Local state (useState, useEffect)
- SessionStorage for temporary data
- LocalStorage for persistent data (theme, auth tokens)

---

### 2. Backend/API Layer (Mock Data)

All backend services are currently simulated with mock data:

#### API Services
1. **Disease Detection API**
   - Simulates ML model for crop disease identification
   - Supports 5 crop types: Rice, Wheat, Cotton, Sugarcane, Vegetables
   - Returns disease name, confidence score, symptoms, causes, treatments

2. **Market Prices API**
   - Mock real-time market price data
   - Multiple commodities and markets
   - Price trends and historical data

3. **Weather API**
   - Simulated weather data
   - Temperature, humidity, rainfall forecasts

4. **IoT Sensor API**
   - Simulates real-time sensor readings
   - Soil moisture, temperature, humidity, light intensity
   - Auto-updates every 5 seconds

5. **Advisory Chat API**
   - Mock AI responses for agricultural queries
   - Contextual recommendations

6. **Farms API**
   - Farm CRUD operations (Create, Read, Update, Delete)
   - Farm details: name, location, size, crops

#### Data Storage
- **Client-side only**: LocalStorage + SessionStorage
- No database connection in prototype
- Data persists only in browser

---

### 3. Technology Stack

#### Frontend
- **React** 18.2 - UI library
- **Vite** 5.0 - Build tool and dev server
- **React Router DOM** 6.20 - Client-side routing
- **Tailwind CSS** 3.3 - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** 2.10 - Charts and data visualization

#### Testing
- **Vitest** 4.0 - Unit testing framework
- **@testing-library/react** 16.3 - React component testing
- **fast-check** 4.5 - Property-based testing
- **@fast-check/vitest** 0.2 - Vitest integration for PBT
- **jsdom** 28.1 - DOM simulation for tests

#### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## Key Features

### ✓ Disease Detection
- Upload or capture crop images
- AI-powered disease identification
- Crop-specific disease database (Rice, Wheat, Cotton, Sugarcane, Vegetables)
- Treatment recommendations (chemical and organic)
- Confidence scores and severity levels

### ✓ Real-time IoT Sensor Monitoring
- Live sensor data display
- 4 sensor types: Soil Moisture, Temperature, Humidity, Light Intensity
- Historical data visualization
- Alert system for threshold violations
- Auto-refresh every 5 seconds

### ✓ Farm Management
- Add, edit, delete farms
- Track farm location, size, and crops
- Farm status monitoring (Active/Inactive)
- Summary statistics (total farms, total acres, active farms)

### ✓ Market Price Tracking
- Real-time commodity prices
- Multiple markets and commodities
- Price trends and comparisons
- Historical price data

### ✓ Resource Optimization
- Water usage recommendations
- Fertilizer optimization
- Pesticide recommendations
- Cost-benefit analysis

### ✓ AI Advisory Chat
- Natural language queries
- Agricultural expert advice
- Contextual recommendations
- Multi-language support

### ✓ Yield Prediction
- Crop yield forecasting
- Historical yield data
- Weather-based predictions

### ✓ Community Forum
- Farmer discussions
- Knowledge sharing
- Expert Q&A

### ✓ Multi-language Support
- English, Hindi, Kannada
- Easy language switching
- Persistent language preference

### ✓ Dark/Light Theme
- Toggle between themes
- Persistent theme preference
- Consistent styling across all pages

### ✓ Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Touch-optimized interface

---

## Data Flow

```
User Interaction
    ↓
React Component (Page)
    ↓
Local State / Context
    ↓
Mock API Service (setTimeout simulation)
    ↓
Component Re-render with Data
    ↓
UI Update
```

---

## Navigation Flow

```
Splash → Onboarding → Login/Register → Dashboard
                                           ↓
                    ┌──────────────────────┼──────────────────────┐
                    ↓                      ↓                      ↓
                 Farms                 Sensors              Disease Detection
                    ↓                      ↓                      ↓
              Market Prices          Resource Optimizer    Advisory Chat
                    ↓                      ↓                      ↓
              Yield Prediction         Alerts              Community
                    ↓                      ↓                      ↓
                 Profile               Settings                 ←
```

---

## File Structure

```
prototype/
├── src/
│   ├── pages/              # All page components
│   │   ├── Splash.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Farms.jsx
│   │   ├── SensorMonitor.jsx
│   │   ├── DiseaseDetection.jsx
│   │   ├── MarketPrices.jsx
│   │   ├── ResourceOptimizer.jsx
│   │   ├── AdvisoryChat.jsx
│   │   ├── YieldPrediction.jsx
│   │   ├── Alerts.jsx
│   │   ├── Community.jsx
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   ├── components/         # Reusable components
│   │   ├── Header.jsx
│   │   ├── BottomNav.jsx
│   │   ├── ActionCard.jsx
│   │   └── StatCard.jsx
│   ├── contexts/           # React contexts
│   │   └── ThemeContext.jsx
│   ├── test/               # Test files
│   │   ├── setup.js
│   │   └── bugfix/
│   │       ├── farms-page-bug-exploration.test.jsx
│   │       └── farms-page-preservation.test.jsx
│   ├── App.jsx             # Main app component with routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── ARCHITECTURE.md         # This file
```

---

## Future Enhancements (Not in Prototype)

1. **Real Backend Integration**
   - AWS Amplify backend
   - DynamoDB database
   - AWS Lambda functions
   - Amazon Bedrock for AI

2. **Real ML Models**
   - Actual disease detection model
   - Yield prediction model
   - Resource optimization algorithms

3. **Real IoT Integration**
   - AWS IoT Core
   - MQTT protocol
   - Real sensor hardware

4. **Authentication**
   - AWS Cognito
   - Social login
   - Multi-factor authentication

5. **Advanced Features**
   - Offline mode (PWA)
   - Push notifications
   - Voice commands
   - AR crop visualization

---

## Running the Prototype

### Development
```bash
cd prototype
npm install
npm run dev
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # UI mode
```

### Build
```bash
npm run build
npm run preview
```

---

## Deployment

Currently deployed on AWS Amplify:
- **URL**: https://main.d1k1hd5oc5urro.amplifyapp.com
- **Branch**: main
- **Auto-deploy**: Enabled on push to main

---

## Notes

- This is a **prototype** with mock data
- No real backend or database
- All data is client-side only
- Designed to demonstrate UI/UX and features
- Ready for backend integration

---

## Contact

For questions or issues, please refer to the main project documentation.
