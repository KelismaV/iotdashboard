/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        dashboard: {
          bg: '#F3F5F7',
          sidebar: '#17212B',
          card: '#FFFFFF',
          primary: '#2563EB',
          text: '#202B36',
          secondary: '#64748B',
          border: '#E2E8F0',
          success: '#16A36A',
          warning: '#D99018',
          critical: '#DC4545',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
