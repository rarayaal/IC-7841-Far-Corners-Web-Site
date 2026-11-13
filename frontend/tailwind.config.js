/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#002244",       // Confianza (Dark Deep Navy Blue)
          navyDark: "#00162e",   // Deeper background navy
          navyCard: "#002d57",   // Card navy
          navyDeep: "#001021",   // Deepest navy (overlays)
          green: "#77C65E",      // Crecimiento (Vibrant Fresh Green)
          blue: "#4A90D6",       // Creatividad (Bright Sky/Cerulean Blue)
          lime: "#DCEB4F",       // Energía (Chartreuse / Lime Yellow)
          cream: "#F8F8F2",      // Equilibrio (Off-white / Soft Cream)
          forest: "#008047",     // Comunidad (Rich Forest Green)
          border: "#1e4066",
        }
      },
      fontFamily: {
        // Identidad: solo dos tipografias (acordado con el cliente): Outfit y Playfair Display.
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow-green': '0 0 25px rgba(119, 198, 94, 0.4)',
        'glow-blue': '0 0 25px rgba(74, 144, 214, 0.4)',
        'glow-navy': '0 10px 30px -10px rgba(0, 34, 68, 0.5)',
      }
    },
  },
  plugins: [],
}
