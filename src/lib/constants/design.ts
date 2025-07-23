// src/lib/constants/design.ts

export const colors = {
  // Primary (Vercel Blue)
  primary: {
    50: '#e6f3ff',
    100: '#cce7ff',
    500: '#0070f3',
    600: '#0366d6',
    700: '#0052cc',
    900: '#003d99',
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
  
  // Status colors
  status: {
    success: '#00d647',
    warning: '#ff9500', 
    error: '#ff3b30',
    info: '#007aff',
  },
  
  // Surfaces
  background: '#ffffff',
  surface: '#fafafa',
  surfaceElevated: '#ffffff',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px', 
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;

export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

export const typography = {
  fontFamily: {
    sans: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
  },
  fontSize: {
    xs: ['12px', '16px'],
    sm: ['14px', '20px'],
    base: ['16px', '24px'],
    lg: ['18px', '28px'],
    xl: ['20px', '28px'],
    '2xl': ['24px', '32px'],
    '3xl': ['30px', '36px'],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const animations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    in: 'cubic-bezier(0.32, 0, 0.67, 0)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
} as const;