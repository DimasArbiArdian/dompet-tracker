/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#359FA0",
          mint: "#8AD6D1",
          cream: "#FFF0C5",
          coral: "#FF8C52",
        },
        surface: {
          bg: "#FCFBF7",
          card: "#FFFFFF",
          cream: "#FFF0C5",
        },
        ink: {
          DEFAULT: "#112A2B",
          muted: "#527072",
          border: "#DCE7E7",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'tactile': '0 2px 0 0 #DCE7E7',
        'tactile-teal': '0 3px 0 0 #267879',
        'tactile-coral': '0 3px 0 0 #D96B34',
      }
    },
  },
  plugins: [],
};
