/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Path resolution: Includes every folder in your CVitae project structure
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
  ],
  // 2. NativeWind v4 Preset: Mandatory for Expo SDK 54 integration
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // You can add your custom lime-green colors or theme extensions here
    },
  },
  plugins: [],
};
