/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'surface-color': '#121212',
        'main-bg': '#0b2545',
        'lighter-bg': '#134074',
        'button-bg': '#C6E0FF'
      }
    },
  },
  plugins: [],
}

