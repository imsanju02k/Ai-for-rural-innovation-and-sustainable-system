import { createContext, useContext, useState, useEffect } from 'react'
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage'

const LanguageContext = createContext()

// Translation dictionary
const translations = {
    en: {
        // Common
        home: 'Home',
        settings: 'Settings',
        profile: 'Profile',
        logout: 'Logout',
        cancel: 'Cancel',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        add: 'Add',

        // Header
        krishisankalp: 'KrishiSankalp AI',
        location: 'Location',

        // Navigation
        dashboard: 'Dashboard',
        community: 'Community',
        alerts: 'Alerts',
        sensors: 'Sensors',
        advisory: 'Advisory',

        // Settings
        language: 'Language',
        theme: 'Theme',
        notifications: 'Notifications',
        privacy: 'Privacy',
        account: 'Account',

        // Profile
        farmDetails: 'Farm Details',
        farmName: 'Farm Name',
        farmSize: 'Farm Size',
        crops: 'Crops',
        yourStats: 'Your Stats',
        cropsMonitored: 'Crops Monitored',
        detections: 'Detections',
        successRate: 'Success Rate',

        // Farms
        myFarms: 'My Farms',
        addFarm: 'Add Farm',
        farmSummary: 'Farm Summary',
        totalFarms: 'Total Farms',
        totalAcres: 'Total Acres',
        active: 'Active',
        noFarmsYet: 'No Farms Yet',
        addYourFirstFarm: 'Add your first farm to get started',

        // Achievements
        achievements: 'Achievements',
        unlocked: 'Unlocked',
        points: 'Points',
        complete: 'Complete',

        // Settings - Notifications
        weatherAlerts: 'Weather Alerts',
        getNotifiedAboutWeatherChanges: 'Get notified about weather changes',
        diseaseAlerts: 'Disease Alerts',
        cropDiseaseDetectionNotifications: 'Crop disease detection notifications',
        marketAlerts: 'Market Alerts',
        priceChangesAndMarketUpdates: 'Price changes and market updates',
        irrigationReminders: 'Irrigation Reminders',
        wateringScheduleReminders: 'Watering schedule reminders',
        fertilizerReminders: 'Fertilizer Reminders',
        fertilizationScheduleAlerts: 'Fertilization schedule alerts',

        // Settings - Account
        phoneNumber: 'Phone Number',
        email: 'Email',
        notSet: 'Not set',

        // Settings - Privacy
        dataSharing: 'Data Sharing',
        analytics: 'Analytics',

        // Settings - App Info
        appVersion: 'App Version',
        selectLanguage: 'Select Language',
        appearance: 'Appearance',
        darkMode: 'Dark Mode',
        enabled: 'Enabled',
        disabled: 'Disabled',
        confirmLogout: 'Are you sure you want to logout?',

        // Dashboard
        quickStats: 'Quick Stats',
        cropHealth: 'Crop Health',
        weather: 'Weather',
        marketPrice: 'Market Price',
        waterUsage: 'Water Usage',
        mainActions: 'Main Actions',
        diseaseDetection: 'Disease Detection',
        yieldPrediction: 'Yield Prediction',
        marketPrices: 'Market Prices',
        resourceOptimizer: 'Resource Optimizer',
        askAdvisor: 'Ask Advisor',
        sensorMonitor: 'Sensor Monitor',
        recentActivity: 'Recent Activity',
        view: 'View',

        // Profile Page
        farmerSince: 'Farmer since',
        profileUpdatedSuccessfully: 'Profile updated successfully!',
        nameRequired: 'Name is required',
        invalidEmailFormat: 'Invalid email format',
        invalidPhoneFormat: 'Invalid phone format',
        farmNameRequired: 'Farm name is required',
    },
    kn: {
        // Common
        home: 'ಮನೆ',
        settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
        profile: 'ಪ್ರೊಫೈಲ್',
        logout: 'ಲಾಗ್ ಔಟ್',
        cancel: 'ರದ್ದುಮಾಡಿ',
        save: 'ಉಳಿಸಿ',
        edit: 'ಸಂಪಾದಿಸಿ',
        delete: 'ಅಳಿಸಿ',
        add: 'ಸೇರಿಸಿ',

        // Header
        krishisankalp: 'ಕೃಷಿ ಸಂಕಲ್ಪ AI',
        location: 'ಸ್ಥಳ',

        // Navigation
        dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
        community: 'ಸಮುದಾಯ',
        alerts: 'ಎಚ್ಚರಿಕೆಗಳು',
        sensors: 'ಸಂವೇದಕಗಳು',
        advisory: 'ಸಲಹೆ',

        // Settings
        language: 'ಭಾಷೆ',
        theme: 'ಥೀಮ್',
        notifications: 'ಅಧಿಸೂಚನೆಗಳು',
        privacy: 'ಗೌಪ್ಯತೆ',
        account: 'ಖಾತೆ',

        // Profile
        farmDetails: 'ಜಮೀನಿನ ವಿವರಗಳು',
        farmName: 'ಜಮೀನಿನ ಹೆಸರು',
        farmSize: 'ಜಮೀನಿನ ಗಾತ್ರ',
        crops: 'ಬೆಳೆಗಳು',
        yourStats: 'ನಿಮ್ಮ ಅಂಕಿಅಂಶಗಳು',
        cropsMonitored: 'ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿದ ಬೆಳೆಗಳು',
        detections: 'ಪತ್ತೆಗಳು',
        successRate: 'ಯಶಸ್ಸಿನ ದರ',

        // Farms
        myFarms: 'ನನ್ನ ಜಮೀನುಗಳು',
        addFarm: 'ಜಮೀನು ಸೇರಿಸಿ',
        farmSummary: 'ಜಮೀನಿನ ಸಾರಾಂಶ',
        totalFarms: 'ಒಟ್ಟು ಜಮೀನುಗಳು',
        totalAcres: 'ಒಟ್ಟು ಎಕರೆಗಳು',
        active: 'ಸಕ್ರಿಯ',
        noFarmsYet: 'ಇನ್ನೂ ಜಮೀನುಗಳಿಲ್ಲ',
        addYourFirstFarm: 'ಪ್ರಾರಂಭ ಮಾಡಲು ನಿಮ್ಮ ಮೊದಲ ಜಮೀನು ಸೇರಿಸಿ',

        // Achievements
        achievements: 'ಸಾಧನೆಗಳು',
        unlocked: 'ಅನ್‌ಲಾಕ್ ಮಾಡಲಾಗಿದೆ',
        points: 'ಪಾಯಿಂಟ್‌ಗಳು',
        complete: 'ಪೂರ್ಣ',

        // Settings - Notifications
        weatherAlerts: 'ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು',
        getNotifiedAboutWeatherChanges: 'ಹವಾಮಾನ ಬದಲಾವಣೆಗಳ ಬಗ್ಗೆ ಅಧಿಸೂಚನೆ ಪಡೆಯಿರಿ',
        diseaseAlerts: 'ರೋಗ ಎಚ್ಚರಿಕೆಗಳು',
        cropDiseaseDetectionNotifications: 'ಬೆಳೆ ರೋಗ ಪತ್ತೆ ಅಧಿಸೂಚನೆಗಳು',
        marketAlerts: 'ಮಾರುಕಟ್ಟೆ ಎಚ್ಚರಿಕೆಗಳು',
        priceChangesAndMarketUpdates: 'ಬೆಲೆ ಬದಲಾವಣೆಗಳು ಮತ್ತು ಮಾರುಕಟ್ಟೆ ನವೀಕರಣಗಳು',
        irrigationReminders: 'ನೀರಾವರಣ ನೆನಪುಗಳು',
        wateringScheduleReminders: 'ನೀರಾವರಣ ವೇಳಾಪಟ್ಟಿ ನೆನಪುಗಳು',
        fertilizerReminders: 'ರಸಗೊಬ್ಬರ ನೆನಪುಗಳು',
        fertilizationScheduleAlerts: 'ರಸಗೊಬ್ಬರ ವೇಳಾಪಟ್ಟಿ ಎಚ್ಚರಿಕೆಗಳು',

        // Settings - Account
        phoneNumber: 'ಫೋನ್ ಸಂಖ್ಯೆ',
        email: 'ಇಮೇಲ್',
        notSet: 'ಹೊಂದಿಸಲಾಗಿಲ್ಲ',

        // Settings - Privacy
        dataSharing: 'ಡೇಟಾ ಹಂಚಿಕೆ',
        analytics: 'ವಿಶ್ಲೇಷಣೆ',

        // Settings - App Info
        appVersion: 'ಅಪ್ಲಿಕೇಶನ್ ಆವೃತ್ತಿ',
        selectLanguage: 'ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ',
        appearance: 'ನೋಟ',
        darkMode: 'ಡಾರ್ಕ್ ಮೋಡ್',
        enabled: 'ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ',
        disabled: 'ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ',
        confirmLogout: 'ನೀವು ಲಾಗ್ ಔಟ್ ಮಾಡಲು ಖಚಿತವಾಗಿದ್ದೀರಾ?',

        // Dashboard
        quickStats: 'ತ್ವರಿತ ಅಂಕಿಅಂಶಗಳು',
        cropHealth: 'ಬೆಳೆ ಆರೋಗ್ಯ',
        weather: 'ಹವಾಮಾನ',
        marketPrice: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ',
        waterUsage: 'ನೀರಿನ ಬಳಕೆ',
        mainActions: 'ಮುಖ್ಯ ಕ್ರಿಯೆಗಳು',
        diseaseDetection: 'ರೋಗ ಪತ್ತೆ',
        yieldPrediction: 'ಇಳುವರಿ ಮುನ್ನಡೆ',
        marketPrices: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು',
        resourceOptimizer: 'ಸಂಪನ್ಮೂಲ ಆಪ್ಟಿಮೈজರ್',
        askAdvisor: 'ಸಲಹೆಗಾರನನ್ನು ಕೇಳಿ',
        sensorMonitor: 'ಸಂವೇದಕ ಮಾನಿಟರ್',
        recentActivity: 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ',
        view: 'ವೀಕ್ಷಣೆ',

        // Profile Page
        farmerSince: 'ರೈತ ಆದಿದ್ದು',
        profileUpdatedSuccessfully: 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!',
        nameRequired: 'ಹೆಸರು ಅಗತ್ಯವಾಗಿದೆ',
        invalidEmailFormat: 'ಅಮಾನ್ಯ ಇಮೇಲ್ ಫಾರ್ಮ್ಯಾಟ್',
        invalidPhoneFormat: 'ಅಮಾನ್ಯ ಫೋನ್ ಫಾರ್ಮ್ಯಾಟ್',
        farmNameRequired: 'ಜಮೀನಿನ ಹೆಸರು ಅಗತ್ಯವಾಗಿದೆ',
    },
    hi: {
        // Common
        home: 'होम',
        settings: 'सेटिंग्स',
        profile: 'प्रोफाइल',
        logout: 'लॉगआउट',
        cancel: 'रद्द करें',
        save: 'सहेजें',
        edit: 'संपादित करें',
        delete: 'हटाएं',
        add: 'जोड़ें',

        // Header
        krishisankalp: 'कृषि संकल्प AI',
        location: 'स्थान',

        // Navigation
        dashboard: 'डैशबोर्ड',
        community: 'समुदाय',
        alerts: 'सतर्कताएं',
        sensors: 'सेंसर',
        advisory: 'सलाह',

        // Settings
        language: 'भाषा',
        theme: 'थीम',
        notifications: 'सूचनाएं',
        privacy: 'गोपनीयता',
        account: 'खाता',

        // Profile
        farmDetails: 'खेत विवरण',
        farmName: 'खेत का नाम',
        farmSize: 'खेत का आकार',
        crops: 'फसलें',
        yourStats: 'आपके आंकड़े',
        cropsMonitored: 'निगरानी की गई फसलें',
        detections: 'पहचान',
        successRate: 'सफलता दर',

        // Farms
        myFarms: 'मेरे खेत',
        addFarm: 'खेत जोड़ें',
        farmSummary: 'खेत सारांश',
        totalFarms: 'कुल खेत',
        totalAcres: 'कुल एकड़',
        active: 'सक्रिय',
        noFarmsYet: 'अभी तक कोई खेत नहीं',
        addYourFirstFarm: 'शुरुआत करने के लिए अपना पहला खेत जोड़ें',

        // Achievements
        achievements: 'उपलब्धियां',
        unlocked: 'अनलॉक किया गया',
        points: 'अंक',
        complete: 'पूर्ण',

        // Settings - Notifications
        weatherAlerts: 'मौसम सतर्कताएं',
        getNotifiedAboutWeatherChanges: 'मौसम परिवर्तन के बारे में सूचित रहें',
        diseaseAlerts: 'रोग सतर्कताएं',
        cropDiseaseDetectionNotifications: 'फसल रोग पहचान सूचनाएं',
        marketAlerts: 'बाजार सतर्कताएं',
        priceChangesAndMarketUpdates: 'कीमत परिवर्तन और बाजार अपडेट',
        irrigationReminders: 'सिंचाई अनुस्मारक',
        wateringScheduleReminders: 'पानी देने के शेड्यूल अनुस्मारक',
        fertilizerReminders: 'उर्वरक अनुस्मारक',
        fertilizationScheduleAlerts: 'उर्वरक शेड्यूल सतर्कताएं',

        // Settings - Account
        phoneNumber: 'फोन नंबर',
        email: 'ईमेल',
        notSet: 'सेट नहीं है',

        // Settings - Privacy
        dataSharing: 'डेटा साझाकरण',
        analytics: 'विश्लेषण',

        // Settings - App Info
        appVersion: 'ऐप संस्करण',
        selectLanguage: 'भाषा चुनें',
        appearance: 'दिखावट',
        darkMode: 'डार्क मोड',
        enabled: 'सक्षम',
        disabled: 'अक्षम',
        confirmLogout: 'क्या आप लॉगआउट करना सुनिश्चित हैं?',

        // Dashboard
        quickStats: 'त्वरित आंकड़े',
        cropHealth: 'फसल स्वास्थ्य',
        weather: 'मौसम',
        marketPrice: 'बाजार मूल्य',
        waterUsage: 'जल उपयोग',
        mainActions: 'मुख्य कार्य',
        diseaseDetection: 'रोग पहचान',
        yieldPrediction: 'उपज पूर्वानुमान',
        marketPrices: 'बाजार मूल्य',
        resourceOptimizer: 'संसाधन अनुकूलक',
        askAdvisor: 'सलाहकार से पूछें',
        sensorMonitor: 'सेंसर मॉनिटर',
        recentActivity: 'हाल की गतिविधि',
        view: 'देखें',

        // Profile Page
        farmerSince: 'किसान बने हुए',
        profileUpdatedSuccessfully: 'प्रोफाइल सफलतापूर्वक अपडेट किया गया!',
        nameRequired: 'नाम आवश्यक है',
        invalidEmailFormat: 'अमान्य ईमेल प्रारूप',
        invalidPhoneFormat: 'अमान्य फोन प्रारूप',
        farmNameRequired: 'खेत का नाम आवश्यक है',
    },
}

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider')
    }
    return context
}

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        return getItem(STORAGE_KEYS.APP_LANGUAGE, 'en')
    })

    useEffect(() => {
        setItem(STORAGE_KEYS.APP_LANGUAGE, language)
    }, [language])

    const setLanguage = (lang) => {
        if (!translations[lang]) {
            console.error(`Language ${lang} not supported`)
            return
        }
        setLanguageState(lang)
    }

    const t = (key) => {
        return translations[language]?.[key] || translations.en[key] || key
    }

    const value = {
        language,
        setLanguage,
        t,
        supportedLanguages: ['en', 'kn', 'hi'],
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

export default LanguageContext
