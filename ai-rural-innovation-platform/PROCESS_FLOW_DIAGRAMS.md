# Process Flow Diagrams & Use-Case Diagrams

## KrishiSankalp AI Platform

---

## 1. User Registration & Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ User Opens App
  │
  ├─→ Click "Sign Up"
  │
  ├─→ Enter Details
  │   ├─ Name
  │   ├─ Email
  │   ├─ Phone
  │   ├─ Location
  │   └─ Farm Details
  │
  ├─→ Validate Input
  │   ├─ Email Format Check ✓
  │   ├─ Phone Format Check ✓
  │   └─ Required Fields Check ✓
  │
  ├─→ Send OTP to Email/Phone
  │
  ├─→ User Enters OTP
  │
  ├─→ Verify OTP
  │   ├─ Valid? → Continue
  │   └─ Invalid? → Retry (Max 3 attempts)
  │
  ├─→ Create User Account
  │   ├─ Hash Password
  │   ├─ Store in Cognito
  │   └─ Create DynamoDB Record
  │
  ├─→ Generate JWT Token
  │
  ├─→ Store Token Locally
  │
  ├─→ Redirect to Dashboard
  │
  END ✓

```

---

## 2. Disease Detection Use-Case Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              DISEASE DETECTION USE-CASE FLOW                     │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Farmer Notices Crop Issue
  │
  ├─→ Opens KrishiSankalp App
  │
  ├─→ Navigate to "Disease Detection"
  │
  ├─→ Capture/Upload Crop Image
  │   ├─ Camera: Real-time capture
  │   ├─ Gallery: Select existing image
  │   └─ Validate: Image size, format
  │
  ├─→ Send Image to Backend
  │   └─ Upload to S3 Bucket
  │
  ├─→ Trigger Lambda Function
  │   ├─ Resize Image
  │   ├─ Extract Features
  │   └─ Prepare for Analysis
  │
  ├─→ Call AWS Rekognition
  │   ├─ Detect Objects
  │   ├─ Identify Crop Type
  │   └─ Analyze Leaf Condition
  │
  ├─→ Call Bedrock (Claude 3)
  │   ├─ Analyze Rekognition Results
  │   ├─ Identify Disease
  │   ├─ Assess Severity
  │   └─ Generate Treatment Plan
  │
  ├─→ Store Results in DynamoDB
  │   ├─ Image Reference
  │   ├─ Disease Diagnosis
  │   ├─ Confidence Score
  │   ├─ Treatment Recommendations
  │   └─ Timestamp
  │
  ├─→ Send Results to Frontend
  │   ├─ Disease Name
  │   ├─ Severity Level (Low/Medium/High)
  │   ├─ Treatment Options
  │   ├─ Recommended Products
  │   └─ Prevention Tips
  │
  ├─→ Display Results to Farmer
  │   ├─ Show Disease Image Analysis
  │   ├─ Display Treatment Steps
  │   ├─ Show Nearby Dealers
  │   └─ Option to Share with Expert
  │
  ├─→ Farmer Takes Action
  │   ├─ Buy Recommended Products
  │   ├─ Apply Treatment
  │   ├─ Schedule Follow-up
  │   └─ Rate Diagnosis Accuracy
  │
  END ✓

```

---

## 3. Advisory Chatbot Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│           ADVISORY CHATBOT INTERACTION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Farmer Opens Chat Interface
  │
  ├─→ Select Language
  │   ├─ English
  │   ├─ Kannada
  │   └─ Hindi
  │
  ├─→ Type Question/Query
  │   ├─ "How to increase yield?"
  │   ├─ "Best time to plant?"
  │   ├─ "Water management tips?"
  │   └─ "Pest control methods?"
  │
  ├─→ Send Query to Backend
  │
  ├─→ Retrieve Context
  │   ├─ Farmer's Farm Data
  │   ├─ Crop Type
  │   ├─ Location/Climate
  │   ├─ Soil Type
  │   ├─ Recent Sensor Data
  │   └─ Historical Data
  │
  ├─→ Call Bedrock (Claude 3)
  │   ├─ Analyze Question
  │   ├─ Consider Farm Context
  │   ├─ Generate Personalized Response
  │   ├─ Translate to Selected Language
  │   └─ Format for Mobile Display
  │
  ├─→ Store Conversation
  │   ├─ Question
  │   ├─ Response
  │   ├─ Timestamp
  │   ├─ Farmer ID
  │   └─ Feedback Score
  │
  ├─→ Display Response
  │   ├─ Text Answer
  │   ├─ Step-by-Step Guide
  │   ├─ Related Resources
  │   ├─ Video Links (if available)
  │   └─ Feedback Options
  │
  ├─→ Farmer Provides Feedback
  │   ├─ Helpful? (Yes/No)
  │   ├─ Rate Response (1-5 stars)
  │   ├─ Report Issue
  │   └─ Ask Follow-up Question
  │
  ├─→ Update AI Model
  │   ├─ Store Feedback
  │   ├─ Improve Responses
  │   └─ Track Accuracy
  │
  END ✓

```

---

## 4. IoT Sensor Data Collection & Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│        IOT SENSOR DATA COLLECTION & PROCESSING FLOW              │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ IoT Sensors Collect Data
  │   ├─ Temperature Sensor
  │   ├─ Humidity Sensor
  │   ├─ Soil Moisture Sensor
  │   ├─ Light Intensity Sensor
  │   └─ pH Level Sensor
  │
  ├─→ Data Collected Every 5 Minutes
  │
  ├─→ Publish to AWS IoT Core
  │   ├─ MQTT Protocol
  │   ├─ Topic: farm/{farmId}/sensors
  │   └─ Payload: JSON Data
  │
  ├─→ IoT Rules Engine
  │   ├─ Parse Message
  │   ├─ Validate Data
  │   └─ Route to Processing
  │
  ├─→ Lambda Function Triggered
  │   ├─ Receive Sensor Data
  │   ├─ Validate Values
  │   ├─ Check Thresholds
  │   └─ Calculate Averages
  │
  ├─→ Store in DynamoDB
  │   ├─ Raw Data Storage
  │   ├─ Timestamp
  │   ├─ Farm ID
  │   ├─ Sensor ID
  │   └─ Readings
  │
  ├─→ Check Alert Thresholds
  │   ├─ Temperature: 15-35°C (Normal)
  │   ├─ Humidity: 40-80% (Normal)
  │   ├─ Soil Moisture: 30-60% (Normal)
  │   ├─ pH Level: 6.0-7.5 (Normal)
  │   └─ Light: 1000-3000 lux (Normal)
  │
  ├─→ Threshold Exceeded?
  │   ├─ YES → Generate Alert
  │   │   ├─ Create Alert Record
  │   │   ├─ Send Notification
  │   │   ├─ Email Alert
  │   │   ├─ SMS Alert
  │   │   └─ In-App Notification
  │   │
  │   └─ NO → Continue Monitoring
  │
  ├─→ Cache Recent Data
  │   ├─ ElastiCache (Redis)
  │   ├─ Last 24 Hours
  │   └─ Fast Retrieval
  │
  ├─→ Display on Dashboard
  │   ├─ Real-time Graphs
  │   ├─ Historical Trends
  │   ├─ Alerts & Warnings
  │   └─ Recommendations
  │
  ├─→ Farmer Reviews Data
  │   ├─ Check Current Status
  │   ├─ View Trends
  │   ├─ Receive Recommendations
  │   └─ Take Action
  │
  END ✓

```

---

## 5. Market Price Prediction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│           MARKET PRICE PREDICTION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Farmer Selects Crop
  │   ├─ Rice
  │   ├─ Wheat
  │   ├─ Cotton
  │   ├─ Sugarcane
  │   └─ Other Crops
  │
  ├─→ Request Price Prediction
  │   ├─ Forecast Period: 7/14/30 days
  │   └─ Location: Farmer's Market
  │
  ├─→ Check Cache (Redis)
  │   ├─ Recent Prediction Available?
  │   ├─ YES → Return Cached Data
  │   └─ NO → Continue Processing
  │
  ├─→ Retrieve Historical Data
  │   ├─ Last 2 Years of Prices
  │   ├─ Market Trends
  │   ├─ Seasonal Patterns
  │   ├─ Supply/Demand Data
  │   └─ Weather Data
  │
  ├─→ Call Bedrock (Claude 3)
  │   ├─ Analyze Historical Data
  │   ├─ Consider Seasonal Factors
  │   ├─ Factor in Weather Forecast
  │   ├─ Analyze Market Trends
  │   ├─ Generate Price Forecast
  │   └─ Calculate Confidence Score
  │
  ├─→ Generate Predictions
  │   ├─ 7-Day Forecast
  │   ├─ 14-Day Forecast
  │   ├─ 30-Day Forecast
  │   ├─ Best Selling Time
  │   └─ Expected Price Range
  │
  ├─→ Store Predictions
  │   ├─ DynamoDB Storage
  │   ├─ Timestamp
  │   ├─ Crop Type
  │   ├─ Location
  │   ├─ Forecast Data
  │   └─ Confidence Score
  │
  ├─→ Cache Results
  │   ├─ Redis Cache
  │   ├─ TTL: 1 Hour
  │   └─ Fast Retrieval
  │
  ├─→ Display to Farmer
  │   ├─ Price Chart
  │   ├─ Forecast Table
  │   ├─ Best Selling Time
  │   ├─ Price Range
  │   ├─ Confidence Level
  │   └─ Recommendations
  │
  ├─→ Farmer Makes Decision
  │   ├─ Sell Now or Wait?
  │   ├─ Store for Later?
  │   ├─ Negotiate Price?
  │   └─ Plan Next Crop?
  │
  END ✓

```

---

## 6. Resource Optimization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│           RESOURCE OPTIMIZATION FLOW                             │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Collect Farm Data
  │   ├─ Soil Moisture Levels
  │   ├─ Weather Forecast
  │   ├─ Crop Type & Stage
  │   ├─ Field Size
  │   ├─ Soil Type
  │   └─ Historical Usage
  │
  ├─→ Analyze Current Status
  │   ├─ Water Requirement
  │   ├─ Fertilizer Needs
  │   ├─ Pest Risk Assessment
  │   └─ Disease Risk Assessment
  │
  ├─→ Call Bedrock (Claude 3)
  │   ├─ Analyze All Data
  │   ├─ Calculate Optimal Usage
  │   ├─ Generate Recommendations
  │   ├─ Estimate Cost Savings
  │   └─ Predict Yield Impact
  │
  ├─→ Generate Optimization Plan
  │   ├─ Water Schedule
  │   │   ├─ Irrigation Timing
  │   │   ├─ Water Quantity
  │   │   └─ Frequency
  │   │
  │   ├─ Fertilizer Plan
  │   │   ├─ Type of Fertilizer
  │   │   ├─ Quantity
  │   │   ├─ Application Timing
  │   │   └─ Cost Estimate
  │   │
  │   └─ Pest/Disease Prevention
  │       ├─ Preventive Measures
  │       ├─ Monitoring Schedule
  │       └─ Treatment Options
  │
  ├─→ Store Optimization Plan
  │   ├─ DynamoDB Storage
  │   ├─ Farm ID
  │   ├─ Crop ID
  │   ├─ Plan Details
  │   └─ Timestamp
  │
  ├─→ Display to Farmer
  │   ├─ Optimization Plan
  │   ├─ Expected Savings
  │   │   ├─ Water: 40% reduction
  │   │   ├─ Fertilizer: 35% reduction
  │   │   └─ Cost: 30-40% savings
  │   │
  │   ├─ Expected Yield Increase
  │   ├─ Implementation Steps
  │   └─ Monitoring Schedule
  │
  ├─→ Farmer Implements Plan
  │   ├─ Follow Recommendations
  │   ├─ Monitor Progress
  │   ├─ Adjust as Needed
  │   └─ Track Results
  │
  ├─→ Monitor & Adjust
  │   ├─ Continuous Monitoring
  │   ├─ Compare with Plan
  │   ├─ Adjust Recommendations
  │   └─ Update Predictions
  │
  END ✓

```

---

## 7. Community Feature Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│        COMMUNITY FEATURE INTERACTION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Farmer Opens Community Section
  │
  ├─→ View Available Features
  │   ├─ Share Experience
  │   ├─ Ask Questions
  │   ├─ View Others' Posts
  │   ├─ Join Groups
  │   └─ Connect with Farmers
  │
  ├─→ Create Post/Question
  │   ├─ Select Category
  │   ├─ Write Content
  │   ├─ Add Images
  │   ├─ Add Location Tag
  │   └─ Submit
  │
  ├─→ Store Post
  │   ├─ DynamoDB Storage
  │   ├─ Post ID
  │   ├─ Author ID
  │   ├─ Content
  │   ├─ Images (S3)
  │   ├─ Timestamp
  │   └─ Category
  │
  ├─→ Notify Community
  │   ├─ Send Notifications
  │   ├─ Similar Farmers
  │   ├─ Experts
  │   └─ Group Members
  │
  ├─→ Other Farmers Respond
  │   ├─ Share Experiences
  │   ├─ Provide Solutions
  │   ├─ Ask Follow-up Questions
  │   └─ Rate Responses
  │
  ├─→ Expert Review
  │   ├─ Experts Monitor Posts
  │   ├─ Provide Professional Advice
  │   ├─ Verify Information
  │   └─ Mark as Verified
  │
  ├─→ Display Community Feed
  │   ├─ Posts from Network
  │   ├─ Trending Topics
  │   ├─ Expert Answers
  │   ├─ Verified Solutions
  │   └─ Farmer Ratings
  │
  ├─→ Farmer Learns & Implements
  │   ├─ Read Solutions
  │   ├─ Try Recommendations
  │   ├─ Share Results
  │   └─ Rate Helpfulness
  │
  END ✓

```

---

## 8. Gamification & Achievement Flow

```
┌─────────────────────────────────────────────────────────────────┐
│        GAMIFICATION & ACHIEVEMENT FLOW                           │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Farmer Uses Platform Features
  │   ├─ Use Disease Detection
  │   ├─ Ask Advisory Questions
  │   ├─ Monitor Sensors
  │   ├─ Implement Recommendations
  │   ├─ Share in Community
  │   └─ Complete Tasks
  │
  ├─→ Track Activities
  │   ├─ Feature Usage Count
  │   ├─ Recommendations Implemented
  │   ├─ Community Contributions
  │   ├─ Yield Improvements
  │   └─ Cost Savings
  │
  ├─→ Calculate Points
  │   ├─ Disease Detection: +10 points
  │   ├─ Advisory Question: +5 points
  │   ├─ Sensor Monitoring: +2 points
  │   ├─ Community Post: +15 points
  │   ├─ Helpful Response: +20 points
  │   └─ Yield Improvement: +50 points
  │
  ├─→ Check Achievement Criteria
  │   ├─ Beginner (0-100 points)
  │   ├─ Intermediate (100-500 points)
  │   ├─ Advanced (500-1000 points)
  │   ├─ Expert (1000+ points)
  │   └─ Special Badges
  │
  ├─→ Award Achievements
  │   ├─ Level Up Notification
  │   ├─ Badge Earned
  │   ├─ Certificate Generated
  │   ├─ Leaderboard Update
  │   └─ Reward Points
  │
  ├─→ Store Achievements
  │   ├─ DynamoDB Storage
  │   ├─ Farmer ID
  │   ├─ Achievement Type
  │   ├─ Points Earned
  │   ├─ Timestamp
  │   └─ Badge Image
  │
  ├─→ Display Profile
  │   ├─ Current Level
  │   ├─ Total Points
  │   ├─ Badges Earned
  │   ├─ Achievements
  │   ├─ Leaderboard Rank
  │   └─ Progress Bar
  │
  ├─→ Farmer Motivation
  │   ├─ Compete with Others
  │   ├─ Earn Rewards
  │   ├─ Unlock Features
  │   ├─ Get Recognition
  │   └─ Continue Using Platform
  │
  END ✓

```

---

## 9. End-to-End Farmer Journey

```
┌─────────────────────────────────────────────────────────────────┐
│           END-TO-END FARMER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

DAY 1: ONBOARDING
  ├─→ Download App
  ├─→ Sign Up & Verify
  ├─→ Complete Profile
  ├─→ Add Farm Details
  ├─→ Install IoT Sensors (Optional)
  └─→ Explore Dashboard

DAY 2-7: LEARNING PHASE
  ├─→ Use Disease Detection
  │   └─→ Upload crop image → Get diagnosis
  ├─→ Ask Advisory Questions
  │   └─→ Get personalized advice
  ├─→ Monitor Sensor Data
  │   └─→ View real-time farm conditions
  ├─→ Check Market Prices
  │   └─→ Plan selling strategy
  └─→ Join Community
      └─→ Connect with other farmers

WEEK 2-4: IMPLEMENTATION PHASE
  ├─→ Implement Recommendations
  │   ├─→ Apply disease treatments
  │   ├─→ Optimize water usage
  │   ├─→ Adjust fertilizer application
  │   └─→ Monitor results
  ├─→ Track Progress
  │   ├─→ Monitor sensor data
  │   ├─→ Compare with recommendations
  │   └─→ Adjust as needed
  ├─→ Share Experiences
  │   ├─→ Post in community
  │   ├─→ Help other farmers
  │   └─→ Earn points
  └─→ Earn Achievements
      ├─→ Level up
      ├─→ Earn badges
      └─→ Get recognition

MONTH 2-3: OPTIMIZATION PHASE
  ├─→ Optimize Resources
  │   ├─→ Reduce water usage
  │   ├─→ Optimize fertilizer
  │   ├─→ Prevent diseases
  │   └─→ Increase yield
  ├─→ Plan Next Crop
  │   ├─→ Use market predictions
  │   ├─→ Plan crop rotation
  │   ├─→ Prepare soil
  │   └─→ Schedule planting
  ├─→ Continuous Learning
  │   ├─→ Ask more questions
  │   ├─→ Learn from community
  │   ├─→ Implement new techniques
  │   └─→ Share knowledge
  └─→ Measure Impact
      ├─→ 30% yield increase
      ├─→ 40% water reduction
      ├─→ 35% cost savings
      └─→ 25% income increase

ONGOING: CONTINUOUS IMPROVEMENT
  ├─→ Regular Monitoring
  ├─→ Seasonal Planning
  ├─→ Community Engagement
  ├─→ Continuous Learning
  └─→ Maximize Benefits

```

---

## 10. Data Flow Across System

```
┌─────────────────────────────────────────────────────────────────┐
│              SYSTEM-WIDE DATA FLOW                               │
└─────────────────────────────────────────────────────────────────┘

FRONTEND (React App)
    ↓
    ├─→ User Input
    ├─→ Image Upload
    ├─→ Sensor Data Display
    └─→ Chat Interface
    
    ↓ (HTTPS/JWT)
    
API GATEWAY
    ├─→ Route Requests
    ├─→ Rate Limiting
    ├─→ Validate JWT
    └─→ Log Requests
    
    ↓
    
LAMBDA FUNCTIONS (40+)
    ├─→ Authentication
    ├─→ Image Processing
    ├─→ Data Validation
    ├─→ Business Logic
    └─→ Orchestration
    
    ↓
    
AI/ML SERVICES
    ├─→ AWS Rekognition
    │   └─→ Image Analysis
    │
    └─→ AWS Bedrock (Claude 3)
        ├─→ Disease Diagnosis
        ├─→ Advisory Generation
        ├─→ Price Prediction
        └─→ Optimization
    
    ↓
    
DATA STORAGE
    ├─→ DynamoDB
    │   ├─→ User Data
    │   ├─→ Farm Data
    │   ├─→ Analysis Results
    │   ├─→ Sensor Data
    │   └─→ Chat History
    │
    ├─→ S3
    │   ├─→ Crop Images
    │   ├─→ Backups
    │   └─→ Documents
    │
    └─→ ElastiCache (Redis)
        ├─→ Session Cache
        ├─→ Price Cache
        └─→ Sensor Data Cache
    
    ↓
    
IOT SERVICES
    ├─→ AWS IoT Core
    │   └─→ MQTT Protocol
    │
    └─→ IoT Rules Engine
        └─→ Data Processing
    
    ↓
    
NOTIFICATIONS
    ├─→ SNS (Email/SMS)
    ├─→ In-App Notifications
    └─→ Push Notifications
    
    ↓
    
MONITORING
    ├─→ CloudWatch Logs
    ├─→ CloudWatch Metrics
    └─→ Alarms & Alerts

```

---

## Summary

These process flows and use-case diagrams illustrate:

1. **User Registration** - Secure onboarding with OTP verification
2. **Disease Detection** - AI-powered crop disease diagnosis
3. **Advisory Chatbot** - Personalized farming advice in multiple languages
4. **IoT Monitoring** - Real-time sensor data collection and alerts
5. **Market Prediction** - AI-driven price forecasting
6. **Resource Optimization** - Smart water and fertilizer management
7. **Community** - Farmer-to-farmer knowledge sharing
8. **Gamification** - Engagement through achievements and rewards
9. **Farmer Journey** - Complete user experience from onboarding to optimization
10. **System Data Flow** - How all components work together

Each flow demonstrates how the platform integrates AI, IoT, and cloud services to deliver value to rural farmers.
