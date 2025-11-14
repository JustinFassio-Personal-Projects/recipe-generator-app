/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      'caramellatte', // Register custom theme
      'silk', // Register custom theme
    ],
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
