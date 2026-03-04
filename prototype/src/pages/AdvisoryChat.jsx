import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { Send, Bot, User, Sparkles, Leaf, Droplets, Bug, TrendingUp } from 'lucide-react'

const AdvisoryChat = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I\'m your AI farming advisor. How can I help you today?',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: 2,
      type: 'bot',
      text: 'I can help you with crop diseases, irrigation, fertilizers, market prices, and more!',
      timestamp: new Date(Date.now() - 290000),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const quickActions = [
    {
      icon: Bug,
      label: 'Disease Detection',
      query: 'How do I identify crop diseases?',
    },
    {
      icon: Droplets,
      label: 'Irrigation Tips',
      query: 'What are the best irrigation practices?',
    },
    {
      icon: Leaf,
      label: 'Fertilizer Guide',
      query: 'Which fertilizer should I use for rice?',
    },
    {
      icon: TrendingUp,
      label: 'Market Prices',
      query: 'What are current market prices?',
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('disease') || lowerMessage.includes('pest')) {
      return 'For disease detection, I recommend:\n\n1. Upload a photo of affected leaves using our Disease Detection feature\n2. Check for common symptoms like yellowing, spots, or wilting\n3. Apply organic neem oil as a preventive measure\n4. Ensure proper spacing between plants for air circulation\n\nWould you like me to guide you to the Disease Detection page?'
    } else if (lowerMessage.includes('irrigation') || lowerMessage.includes('water')) {
      return 'Here are optimal irrigation practices:\n\n1. Water early morning (5-7 AM) to reduce evaporation\n2. Check soil moisture before watering\n3. Use drip irrigation for 30% water savings\n4. Adjust frequency based on weather conditions\n\nYour current soil moisture is at 68% - optimal range!'
    } else if (lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrient')) {
      return 'For rice cultivation, I recommend:\n\n1. NPK ratio: 4:2:1 for vegetative stage\n2. Apply urea in 3 splits: 25% basal, 50% tillering, 25% panicle\n3. Add organic compost for better soil health\n4. Conduct soil test every 6 months\n\nWould you like specific fertilizer recommendations?'
    } else if (lowerMessage.includes('price') || lowerMessage.includes('market')) {
      return 'Current market prices in your area:\n\n🌾 Rice: ₹2,550/quintal (↑12%)\n🌾 Wheat: ₹2,100/quintal (↑8%)\n🌾 Cotton: ₹6,800/quintal (↓3%)\n\nPrices are trending upward. Good time to sell rice and wheat!'
    } else if (lowerMessage.includes('weather')) {
      return 'Weather forecast for next 7 days:\n\n☀️ Today: 32°C, Sunny\n🌤️ Tomorrow: 30°C, Partly cloudy\n🌧️ Day 3-4: Light rain expected\n☀️ Day 5-7: Clear skies\n\nRecommendation: Plan irrigation accordingly. Rain expected in 2 days.'
    } else {
      return 'I\'m here to help! You can ask me about:\n\n• Crop diseases and pest control\n• Irrigation and water management\n• Fertilizer recommendations\n• Market prices and trends\n• Weather forecasts\n• Soil health\n\nWhat would you like to know more about?'
    }
  }

  const handleSend = () => {
    if (!inputText.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        text: generateBotResponse(inputText),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickAction = (query) => {
    setInputText(query)
    setTimeout(() => handleSend(), 100)
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-neutral-bg pb-20 flex flex-col">
      <Header showBack={true} title="Advisory Chat" />

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-neutral-divider px-4 py-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-green-600 rounded-full flex items-center justify-center mr-3">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-text">
                KrishiSankalp AI Advisor
              </h2>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-status-success rounded-full mr-2"></div>
                <span className="text-sm text-neutral-text-secondary">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="px-4 py-4 bg-white border-b border-neutral-divider">
            <p className="text-sm text-neutral-text-secondary mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.query)}
                    className="flex items-center p-3 bg-neutral-bg rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Icon size={20} className="text-primary mr-2" />
                    <span className="text-sm font-medium text-neutral-text">
                      {action.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                    ? 'bg-primary ml-2'
                    : 'bg-gradient-to-br from-primary to-green-600 mr-2'
                    }`}
                >
                  {message.type === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${message.type === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white border border-neutral-divider text-neutral-text'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                  </div>
                  <p
                    className={`text-xs text-neutral-text-secondary mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'
                      }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-green-600 rounded-full flex items-center justify-center mr-2">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white border border-neutral-divider rounded-2xl px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-neutral-text-secondary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-neutral-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-neutral-divider px-4 py-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about farming..."
              className="flex-1 px-4 py-3 border border-neutral-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${inputText.trim()
                ? 'bg-primary text-white hover:bg-green-700'
                : 'bg-neutral-bg text-neutral-text-secondary'
                }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default AdvisoryChat
