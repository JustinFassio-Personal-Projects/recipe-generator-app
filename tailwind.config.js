/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  plugins: [require('daisyui')],
  daisyui: {
    // Themes are defined in src/index.css using CSS plugin format (Tailwind v4)
    // See docs/theme/DaisyUI-Theme-Guide.md for theme definitions
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
