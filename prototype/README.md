# AI Rural Innovation Platform - React Prototype

A complete React.js + Tailwind CSS prototype for the AI Rural Innovation Platform, showcasing core functionality for rural farmers.

## 🚀 Features

- **Disease Detection**: AI-powered crop disease identification with treatment recommendations
- **Market Intelligence**: Real-time market prices and buyer connections
- **Resource Optimization**: Smart irrigation and fertilizer recommendations
- **Advisory Chatbot**: Multilingual AI assistant for agricultural advice
- **IoT Sensor Monitoring**: Real-time farm data visualization
- **Alerts & Notifications**: Timely updates on weather, pests, and market opportunities
- **Community Forum**: Farmer-to-farmer knowledge sharing
- **Profile Management**: User account and farm management

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation

1. **Navigate to the prototype directory:**
   ```bash
   cd Ai-for-rural-innovation-and-sustainable-system/prototype
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
prototype/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── BottomNav.jsx
│   │   └── Header.jsx
│   ├── pages/          # Page components
│   │   ├── Splash.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DiseaseDetection.jsx
│   │   ├── MarketPrices.jsx
│   │   ├── ResourceOptimizer.jsx
│   │   ├── AdvisoryChat.jsx
│   │   ├── SensorMonitor.jsx
│   │   ├── Alerts.jsx
│   │   ├── Community.jsx
│   │   └── Profile.jsx
│   ├── App.jsx         # Main app component with routing
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🎨 Design System

### Colors
- **Primary Green**: `#2E7D32` (Main actions, success states)
- **Primary Dark**: `#1B5E20` (Hover states)
- **Primary Light**: `#4CAF50` (Accents)
- **Secondary Blue**: `#1976D2` (Information)
- **Warning Orange**: `#F57C00` (Warnings)
- **Error Red**: `#D32F2F` (Errors)

### Typography
- **Font Family**: Roboto
- **Sizes**: 12px - 24px
- **Weights**: 300, 400, 500, 700

### Spacing
- Based on 8px grid system
- Utilities: 4px, 8px, 16px, 24px, 32px, 48px

### Components
- **Buttons**: Primary, Secondary, Icon
- **Cards**: Elevated with 8px radius
- **Inputs**: 48px height with focus states
- **Badges**: Status indicators
- **Navigation**: Top header + Bottom nav

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Responsive Design

The prototype is optimized for:
- **Mobile**: 375px - 480px (Primary target)
- **Tablet**: 481px - 768px
- **Desktop**: 769px+

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🎯 Key User Flows

### 1. Onboarding Flow
```
Splash → Onboarding (3 screens) → Login/Register → Dashboard
```

### 2. Disease Detection Flow
```
Dashboard → Disease Detection → Camera/Upload → Analysis → Results → Treatments
```

### 3. Market Intelligence Flow
```
Dashboard → Market Prices → Price Comparison → Buyer Matching → Contact
```

### 4. Resource Optimization Flow
```
Dashboard → Resource Optimizer → Irrigation Schedule → Fertilizer Recommendations
```

## 🔐 Authentication

The prototype includes mock authentication:
- **Login**: Any phone number + password
- **Register**: Fill form and submit
- **Protected Routes**: Redirect to login if not authenticated

## 📊 Mock Data

The prototype uses mock data for demonstration:
- Sample disease detection results
- Market price data
- Sensor readings
- Weather forecasts
- Community posts

## 🚧 Future Enhancements

- [ ] Connect to real AWS backend APIs
- [ ] Implement actual camera functionality
- [ ] Add real-time data updates
- [ ] Integrate payment gateway
- [ ] Add offline mode with service workers
- [ ] Implement push notifications
- [ ] Add multilingual support (Hindi, Tamil, Telugu, Bengali, Marathi)
- [ ] Integrate voice input/output
- [ ] Add data visualization charts
- [ ] Implement real-time chat

## 🤝 Contributing

This is a prototype for demonstration purposes. For production implementation:
1. Replace mock data with real API calls
2. Implement proper authentication with AWS Cognito
3. Add error handling and loading states
4. Implement offline functionality
5. Add comprehensive testing
6. Optimize performance
7. Add accessibility features

## 📄 License

This project is part of the AI Rural Innovation Platform specification.

## 📞 Support

For questions or issues, refer to the main project documentation in the parent directory.

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Lucide Icons](https://lucide.dev/)

## 🔗 Related Files

- `../requirements.md` - Complete requirements specification
- `../design.md` - Technical design document
- `../tasks.md` - Implementation task list
- `../AWS_PROTOTYPE_GUIDE.md` - AWS backend setup guide
- `../FIGMA_AI_COMPLETE_PROMPTS.md` - UI design specifications

---

**Built with ❤️ for rural farmers**
