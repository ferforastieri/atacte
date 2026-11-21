/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        canvas: '#f8fafc',
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f1f5f9',
          raised: '#ffffff',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#475569',
          subtle: '#5b6b80',
          inverse: '#f8fafc',
        },
        line: {
          DEFAULT: '#e2e8f0',
          strong: '#cbd5e1',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          700: '#047857',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#d97706',
          700: '#b45309',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};
