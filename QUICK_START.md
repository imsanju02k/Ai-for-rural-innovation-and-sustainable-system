# 🚀 Quick Start Guide - AI Rural Innovation Platform

## View the Application NOW (3 Steps)

### Step 1: Start the Frontend

```bash
cd Ai-for-rural-innovation-and-sustainable-system/prototype
npm run dev
```

### Step 2: Open Browser

Navigate to: **http://localhost:5173** or **http://localhost:3000**

### Step 3: Test the App

1. **Register a new user**:
   - Email: `test@example.com`
   - Password: `Test@1234`
   - Name: `Test Farmer`

2. **Explore features**:
   - Dashboard
   - Disease Detection
   - Market Prices
   - Advisory Chat
   - Sensor Monitor

---

## 📦 Files to Push to GitHub

### Essential Files (Copy this list)

```
# Root files
.gitignore
README.md
FRONTEND_DEPLOYMENT_GUIDE.md
QUICK_START.md

# Frontend (prototype)
Ai-for-rural-innovation-and-sustainable-system/
├── prototype/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BottomNav.jsx
│   │   │   └── Header.jsx
│   │   ├── pages/
│   │   │   ├── Splash.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DiseaseDetection.jsx
│   │   │   ├── MarketPrices.jsx
│   │   │   ├── ResourceOptimizer.jsx
│   │   │   ├── AdvisoryChat.jsx
│   │   │   ├── SensorMonitor.jsx
│   │   │   ├── Alerts.jsx
│   │   │   ├── Community.jsx
│   │   │   └── Profile.jsx
│   │   ├── aws-config.js          ← IMPORTANT!
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── amplify.yml                ← IMPORTANT!
│   ├── README.md
│   └── SETUP_GUIDE.md
├── requirements.md
├── design.md
├── AWS_PROTOTYPE_GUIDE.md
└── PROJECT_SUMMARY.md

# Backend (aws-backend-infrastructure)
aws-backend-infrastructure/
├── lib/
│   ├── stacks/
│   ├── constructs/
│   └── config/
├── lambda/
├── bin/
├── docs/
├── scripts/
├── test/
├── cdk.json
├── package.json
├── tsconfig.json
├── jest.config.js
├── README.md
├── DEPLOYMENT_GUIDE.md
└── buildspec.yml

# Documentation
├── FRONTEND_DEPLOYMENT_GUIDE.md
├── QUICK_START.md
└── README.md
```

### Files to EXCLUDE (Already in .gitignore)

```
# DO NOT PUSH:
node_modules/
dist/
build/
cdk.out/
.env
*.log
*.pem
*.key
.DS_Store
.vscode/
```

---

## 🔧 Git Commands

### Initialize and Push

```bash
# 1. Initialize Git (if not already done)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit: AI Rural Innovation Platform"

# 4. Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/ai-rural-innovation-platform.git

# 5. Push to GitHub
git push -u origin main
```

### If you get "main" branch error

```bash
# Rename branch to main
git branch -M main

# Then push
git push -u origin main
```

---

## 🌐 Deploy to AWS Amplify (After GitHub Push)

### Method 1: Amplify Console (Easiest)

1. Go to: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Choose "GitHub"
4. Select your repository
5. Select branch: `main`
6. Build settings: Auto-detected from `amplify.yml`
7. Click "Save and deploy"

**Done!** Your app will be live at: `https://[app-id].amplifyapp.com`

### Method 2: Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
cd Ai-for-rural-innovation-and-sustainable-system/prototype
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

---

## ✅ Verification Checklist

### Local Testing
- [ ] Frontend runs on localhost:5173
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Dashboard loads correctly
- [ ] All pages accessible
- [ ] No console errors

### GitHub
- [ ] Repository created
- [ ] All files pushed
- [ ] .gitignore working (no node_modules)
- [ ] README.md visible

### AWS Amplify
- [ ] App deployed successfully
- [ ] Public URL accessible
- [ ] HTTPS enabled
- [ ] Authentication works
- [ ] API calls successful

---

## 🎯 Current Status

### ✅ Completed
- AWS Backend Infrastructure deployed
- API Gateway: `https://hkwp4iwhu6.execute-api.us-east-1.amazonaws.com/dev`
- Cognito User Pool configured
- S3 Bucket for images
- All Lambda functions operational
- Frontend configured with AWS Amplify
- AWS configuration file created

### 🔄 Next Steps
1. Test locally (npm run dev)
2. Push to GitHub
3. Deploy to AWS Amplify
4. Share public URL

---

## 📞 Quick Help

### Frontend not loading?
```bash
cd Ai-for-rural-innovation-and-sustainable-system/prototype
rm -rf node_modules dist
npm install
npm run dev
```

### Can't push to GitHub?
```bash
# Check remote
git remote -v

# If no remote, add it
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Force push if needed
git push -u origin main --force
```

### Amplify build failing?
- Check `amplify.yml` exists in prototype directory
- Verify `package.json` has correct scripts
- Check build logs in Amplify Console

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Live web application
- ✅ AWS backend integration
- ✅ User authentication
- ✅ All features working
- ✅ HTTPS enabled
- ✅ Continuous deployment from GitHub

**Share your app URL**: `https://[your-app-id].amplifyapp.com`

---

**Need detailed instructions?** See `FRONTEND_DEPLOYMENT_GUIDE.md`
