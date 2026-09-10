import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // الأزرق مأخوذ من الشعار الرسمي لمجلس عائلة النتشة (القسم 49.1). أحمر
        // التطريز والزيتوني أُضيفا لاحقًا كهوية بصرية مستوحاة من التطريز الخليلي
        // وشجرة الزيتون الفلسطينية، بدل الاعتماد الكامل على الأزرق وحده.
        primary: {
          DEFAULT: '#005CB6',
          dark: '#00417F',
          soft: '#E4EEFB',
        },
        accent: {
          DEFAULT: '#A8324A',
          dark: '#7E2438',
          soft: '#F5E3E7',
        },
        olive: {
          DEFAULT: '#6E7B3D',
          dark: '#57612F',
          soft: '#EEF0E1',
        },
        verified: '#1F8A5F',
        // خلفية دافئة للصفحات العامة بدل رمادي Tailwind الافتراضي البارد
        // (slate) — لا تُستخدم في لوحة الإدارة.
        cream: {
          DEFAULT: '#FAF6F0',
          dark: '#F1E9DC',
        },
      },
      fontFamily: {
        heading: ['var(--font-cairo)', 'Tahoma', 'sans-serif'],
        display: ['var(--font-messiri)', 'var(--font-cairo)', 'Tahoma', 'sans-serif'],
        body: ['var(--font-plex-arabic)', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
