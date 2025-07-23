/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary (Vercel Blue inspired)
        primary: {
          50: '#e6f3ff',
          100: '#cce7ff',
          200: '#99cfff',
          300: '#66b7ff',
          400: '#339fff',
          500: '#0070f3', // Vercel blue
          600: '#0366d6',
          700: '#0052cc',
          800: '#003d99',
          900: '#002966',
        },
        
        // Grays (Apple-like)
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#0a0a0a',
        },
        
        // Status colors (Apple inspired)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#00d647', // Apple green
          600: '#00c93f',
          700: '#00b837',
        },
        
        warning: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#ff9500', // Apple orange
          600: '#ea580c',
          700: '#c2410c',
        },
        
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ff3b30', // Apple red
          600: '#dc2626',
          700: '#b91c1c',
        },
        
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#007aff', // Apple blue
          600: '#2563eb',
          700: '#1d4ed8',
        },
        
        // Surfaces
        background: '#ffffff',
        surface: {
          50: '#fafafa',
          100: '#f5f5f5',
          elevated: '#ffffff',
        },
      },
      
      fontFamily: {
        sans: [
          'SF Pro Display',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Cascadia Code',
          'Roboto Mono',
          'monospace'
        ],
      },
      
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0.05em' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '0.025em' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '0' }],
        lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.025em' }],
        xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.025em' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.05em' }],
        '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.05em' }],
        '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.1em' }],
      },
      
      borderRadius: {
        'none': '0',
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'glass': '0 8px 32px 0 rgb(0 0 0 / 0.12)',
      },
      
      animation: {
        'fade-in': 'fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-soft': 'bounceSoft 1s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(8px)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideDown: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-8px)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in': 'cubic-bezier(0.32, 0, 0.67, 0)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [
    // Plugin pour focus ring moderne
    function({ addUtilities }) {
      addUtilities({
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            'box-shadow': '0 0 0 2px rgb(59 130 246 / 0.2)',
            'border-color': 'rgb(59 130 246)',
          },
        },
        '.glass': {
          'backdrop-filter': 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
      });
    },
  ],
}