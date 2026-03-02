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
