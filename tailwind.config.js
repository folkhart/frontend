/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde7c5',
          200: '#fbcf8b',
          300: '#f9b751',
          400: '#f79f17',
          500: '#d68910',
          600: '#b5730d',
          700: '#945d0a',
          800: '#734707',
          900: '#523104',
        },
      },
      fontFamily: {
        game: ['"Press Start 2P"', 'cursive'],
      },
    },
  },
  plugins: [],
}
