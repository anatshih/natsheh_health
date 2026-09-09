import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // مأخوذة من الشعار الرسمي لمجلس عائلة النتشة (القسم 49.1 من وثيقة المتطلبات)
        primary: {
          DEFAULT: '#005CB6',
          dark: '#00417F',
          soft: '#E4EEFB',
        },
        accent: {
          DEFAULT: '#B4842A',
        },
        verified: '#1F8A5F',
      },
      fontFamily: {
        heading: ['var(--font-cairo)', 'Tahoma', 'sans-serif'],
        body: ['var(--font-plex-arabic)', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
