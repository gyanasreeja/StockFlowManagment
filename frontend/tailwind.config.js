export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"] },
      colors: { ink: "#1f2a37", moss: { 50: "#f1f7f4", 100: "#dcece4", 600: "#1f7a5c", 700: "#186349", 800: "#134e3a" } },
    },
  },
  plugins: [],
};