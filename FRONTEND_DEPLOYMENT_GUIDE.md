# Frontend Deployment Guide - AI Rural Innovation Platform

## 🚀 Complete Setup & Deployment Instructions

This guide provides step-by-step instructions to deploy and test the complete AI Rural Innovation Platform with AWS backend integration.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Configuration](#backend-configuration)
3. [Frontend Setup](#frontend-setup)
4. [Running Locally](#running-locally)
5. [Testing the Application](#testing-the-application)
6. [Deploying to AWS Amplify Hosting](#deploying-to-aws-amplify-hosting)
7. [GitHub Repository Setup](#github-repository-setup)
8. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software
- ✅ Node.js 18+ and npm
- ✅ AWS CLI configured with credentials
- ✅ Git installed
- ✅ Modern web browser (Chrome, Firefox, Safari, Edge)

### AWS Resources (Already Deployed)
- ✅ API Gateway: `https://hkwp4iwhu6.execute-api.us-east-1.amazonaws.com/dev`
- ✅ Cognito User Pool: `us-east-1_wBAvFZ0SK`
- ✅ Cognito User Pool Client: `bcav3ls91uen7iiplno5rd03n`
- ✅ S3 Bucket: `dev-farm-images-339712928283`
- ✅ All Lambda functions and DynamoDB tables

---

## 2. Backend Configuration

### Current Configuration

The AWS backend is already configured in:
```
Ai-for-rural-innovation-and-sustainable-system/prototype/src/aws-config.js
```

**Configuration Details:**
```javascript
{
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_wBAvFZ0SK',
      userPoolClientId: 'bcav3ls91uen7iiplno5rd03n',
      identityPoolId: 'us-east-1:c9686f9b-cab7-46e4-a5b2-a905c133b486',
    }
  },
  API: {
    REST: {
      FarmAPI: {
        endpoint: 'https://hkwp4iwhu6.execute-api.us-east-1.amazonaws.com/dev',
        region: 'us-east-1',
      }
    }
  },
  Storage: {
    S3: {
      bucket: 'dev-farm-images-339712928283',
      region: 'us-east-1',
    }
  }
}
```

---

## 3. Frontend Setup

### Install Dependencies

```bash
cd Ai-for-rural-innovation-and-sustainable-system/prototype
npm install
```

### Verify AWS Amplify Installation

The following packages should be installed:
- `aws-amplify` - AWS Amplify core library
- `@aws-amplify/ui-react` - Amplify UI components for React

---

## 4. Running Locally

### Start Development Server

```bash
cd Ai-for-rural-innovation-and-sustainable-system/prototype
npm run dev
```

The application will start on:
- **URL**: `http://localhost:5173` (Vite default) or `http://localhost:3000`
- **Auto-open**: Browser should open automatically

### What You'll See

1. **Splash Screen** - Welcome screen with app logo
2. **Onboarding** - 3-screen tutorial
3. **Login/Register** - Authentication screens
4. **Dashboard** - Main app interface with all features

---

## 5. Testing the Application

### 5.1 Test User Registration

1. Navigate to Register screen
2. Fill in the form:
   - **Name**: Test Farmer
   - **Email**: testfarmer@example.com
   - **Password**: Test@1234 (must meet requirements)
   - **Phone**: +1234567890
   - **Role**: Farmer
3. Click "Create Account"
4. Check email for verification code
5. Enter verification code

### 5.2 Test User Login

1. Navigate to Login screen
2. Enter credentials:
   - **Email**: testfarmer@example.com
   - **Password**: Test@1234
3. Click "Sign In"
4. Should redirect to Dashboard

### 5.3 Test Features

#### Farm Management
- **Create Farm**: Dashboard → Add Farm
- **View Farms**: Dashboard → My Farms
- **Edit Farm**: Click on farm → Edit
- **Delete Farm**: Click on farm → Delete

#### Disease Detection
- **Upload Image**: Disease Detection → Upload/Camera
- **View Analysis**: See AI-powered disease identification
- **Treatment Recommendations**: View suggested treatments

#### Market Prices
- **View Prices**: Market Prices → Browse commodities
- **Price Predictions**: Click "Predict" for forecasts
- **Compare Prices**: View historical data

#### Advisory Chatbot
- **Ask Questions**: Advisory Chat → Type message
- **Get Recommendations**: Receive AI-powered advice
- **View History**: See past conversations

#### IoT Sensor Monitoring
- **View Sensor Data**: Sensor Monitor → Real-time data
- **Check Alerts**: View threshold alerts
- **Historical Data**: View trends and graphs

---

## 6. Deploying to AWS Amplify Hosting

### Option A: Deploy via AWS Amplify Console (Recommended)

#### Step 1: Create Amplify App

```bash
# Navigate to AWS Amplify Console
# https://console.aws.amazon.com/amplify/

# Click "New app" → "Host web app"
# Choose "Deploy without Git provider" for quick start
```

#### Step 2: Build Settings

Create `amplify.yml` in the prototype directory:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### Step 3: Deploy

```bash
# Build the application
cd Ai-for-rural-innovation-and-sustainable-system/prototype
npm run build

# The build output will be in the 'dist' directory
# Upload this directory to Amplify Console
```

### Option B: Deploy via GitHub (Continuous Deployment)

See [GitHub Repository Setup](#github-repository-setup) section below.

---

## 7. GitHub Repository Setup

### Files to Push to GitHub

#### Essential Files (MUST INCLUDE)

**Frontend Files:**
```
Ai-for-rural-innovation-and-sustainable-system/
├── prototype/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── aws-config.js          ← AWS configuration
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── amplify.yml                ← Amplify build config
│   └── README.md
```

**Backend Files:**
```
aws-backend-infrastructure/
├── lib/
│   ├── stacks/
│   ├── constructs/
│   └── config/
├── bin/
├── lambda/
├── docs/
├── scripts/
├── test/
├── cdk.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── README.md
└── .gitignore
```

**Documentation Files:**
```
├── FRONTEND_DEPLOYMENT_GUIDE.md   ← This file
├── README.md                       ← Project overview
└── .gitignore                      ← Git ignore rules
```

#### Files to EXCLUDE (Add to .gitignore)

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production builds
dist/
build/
cdk.out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# AWS
.aws-sam/
*.pem
*.key
test-device.*.pem
test-device.*.key

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# CDK
cdk.context.json
```

### Git Commands

```bash
# Initialize repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: AI Rural Innovation Platform with AWS backend"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/ai-rural-innovation-platform.git

# Push to GitHub
git push -u origin main
```

### Connect GitHub to AWS Amplify

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Choose "GitHub"
4. Authorize AWS Amplify to access your repository
5. Select repository and branch
6. Configure build settings (use amplify.yml)
7. Click "Save and deploy"

**Amplify will automatically:**
- Build on every push to main branch
- Deploy to a public URL
- Provide preview URLs for pull requests
- Enable HTTPS automatically

---

## 8. Troubleshooting

### Issue: Blank Page on localhost:3000

**Solution:**
```bash
# Stop the server (Ctrl+C)
# Clear cache and restart
rm -rf node_modules dist
npm install
npm run dev
```

### Issue: AWS Amplify Configuration Error

**Solution:**
Check that `aws-config.js` exists and is imported in `main.jsx`:
```javascript
import awsConfig from './aws-config'
import { Amplify } from 'aws-amplify'
Amplify.configure(awsConfig)
```

### Issue: Authentication Fails

**Possible Causes:**
1. Cognito User Pool not accessible
2. Incorrect credentials in aws-config.js
3. CORS issues

**Solution:**
```bash
# Verify Cognito configuration
aws cognito-idp describe-user-pool --user-pool-id us-east-1_wBAvFZ0SK

# Check API Gateway CORS
aws apigateway get-rest-api --rest-api-id hkwp4iwhu6
```

### Issue: API Calls Fail

**Solution:**
1. Check API Gateway endpoint is accessible
2. Verify authentication token is being sent
3. Check CloudWatch logs for Lambda errors

```bash
# Test API endpoint
curl https://hkwp4iwhu6.execute-api.us-east-1.amazonaws.com/dev/health

# View Lambda logs
aws logs tail /aws/lambda/dev-auth-login --follow
```

### Issue: S3 Upload Fails

**Solution:**
1. Verify S3 bucket permissions
2. Check CORS configuration on S3 bucket
3. Ensure user is authenticated

```bash
# Check S3 bucket
aws s3 ls s3://dev-farm-images-339712928283

# Verify CORS configuration
aws s3api get-bucket-cors --bucket dev-farm-images-339712928283
```

---

## 📊 Application URLs

### Development
- **Local**: http://localhost:5173 or http://localhost:3000
- **API**: https://hkwp4iwhu6.execute-api.us-east-1.amazonaws.com/dev

### Production (After Amplify Deployment)
- **Amplify URL**: https://[app-id].amplifyapp.com
- **Custom Domain**: (Configure in Amplify Console)

---

## 🎯 Next Steps

1. ✅ Test all features locally
2. ✅ Push code to GitHub
3. ✅ Deploy to AWS Amplify
4. ✅ Configure custom domain (optional)
5. ✅ Set up CI/CD pipeline
6. ✅ Monitor application performance
7. ✅ Collect user feedback

---

## 📞 Support

For issues or questions:
- Check CloudWatch Logs for backend errors
- Review API Gateway logs
- Check browser console for frontend errors
- Refer to AWS Amplify documentation: https://docs.amplify.aws/

---

## 🎓 Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)

---

**Built with ❤️ for rural farmers**
