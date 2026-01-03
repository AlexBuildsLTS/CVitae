const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Explicitly allow Metro to resolve CSS files
config.resolver.sourceExts.push('css');

module.exports = withNativeWind(config, {
  input: 'global.css', // Flat string fix for Vercel
  projectRoot: __dirname,
  inlineStyles: true, // Ultimate safety net for styles
});
