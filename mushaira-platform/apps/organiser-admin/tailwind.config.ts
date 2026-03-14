import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B2C83',
          50: '#F5EDFF',
          100: '#E8D5FF',
          200: '#D4ADFF',
          600: '#5B2C83',
          700: '#461E68',
          800: '#31154E',
          foreground: '#FFFFFF',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#EED966',
          dark: '#B8932A',
          foreground: '#1A1A2E',
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
