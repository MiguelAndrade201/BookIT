import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f7f3ec',
        sage: '#48523b',
        moss: '#657153',
        sand: '#ded3c0',
        ink: '#1d1c18'
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        soft: '0 18px 50px rgba(29, 28, 24, .10)'
      }
    }
  },
  plugins: []
};
export default config;
