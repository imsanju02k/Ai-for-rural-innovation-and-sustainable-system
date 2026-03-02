/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E7D32',
          dark: '#1B5E20',
          light: '#4CAF50',
        },
        secondary: {
          DEFAULT: '#1976D2',
          orange: '#F57C00',
          red: '#D32F2F',
          yellow: '#FFC107',
        },
        neutral: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          text: '#212121',
          'text-secondary': '#757575',
          divider: '#BDBDBD',
          border: '#E0E0E0',
        },
        status: {
          success: '#4CAF50',
          warning: '#FF9800',
          error: '#F44336',
          info: '#2196F3',
        },
        // Dark mode colors
        dark: {
          bg: '#121212',
          surface: '#1E1E1E',
          'surface-elevated': '#2C2C2C',
          text: '#FFFFFF',
          'text-secondary': '#B0B0B0',
          divider: '#3A3A3A',
          border: '#404040',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'card': '8px',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 8px rgba(0, 0, 0, 0.15)',
        'dark-card': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'dark-card-hover': '0 4px 12px rgba(0, 0, 0, 0.6)',
      },
      transitionProperty: {
        'theme': 'background-color, border-color, color, fill, stroke',
      },
      transitionDuration: {
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
