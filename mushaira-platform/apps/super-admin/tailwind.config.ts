import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1A1A2E',
          light: '#2D2D44',
          dark: '#0D0D1A',
          foreground: '#FFFFFF',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#EED966',
          dark: '#B8932A',
          foreground: '#1A1A2E',
        },
        primary: {
          DEFAULT: '#5B2C83',
          50: '#F5EDFF',
          100: '#E8D5FF',
          600: '#5B2C83',
          700: '#461E68',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        heading: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
