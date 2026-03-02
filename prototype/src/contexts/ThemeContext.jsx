import { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '../utils/localStorage';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        // Load theme from LocalStorage or default to 'light'
        return getItem(STORAGE_KEYS.APP_THEME, 'light');
    });

    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Apply theme to document root
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Save theme preference
        setItem(STORAGE_KEYS.APP_THEME, theme);
    }, [theme]);

    const setTheme = (newTheme) => {
        if (newTheme !== 'light' && newTheme !== 'dark') {
            console.error('Invalid theme. Must be "light" or "dark"');
            return;
        }

        setIsTransitioning(true);
        setThemeState(newTheme);

        // Reset transition state after animation completes
        setTimeout(() => {
            setIsTransitioning(false);
        }, 300);
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const value = {
        theme,
        setTheme,
        toggleTheme,
        isTransitioning,
        isDark: theme === 'dark',
        isLight: theme === 'light',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
