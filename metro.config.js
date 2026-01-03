const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path'); // MUST include this

const config = getDefaultConfig(__dirname);

// Enable CSS support
config.resolver.sourceExts.push('css');

// Senior Fix: Limit workers to 2 for Vercel's 2-core machine to prevent hangs
config.maxWorkers = 2;

module.exports = withNativeWind(config, {
  // Use path.resolve to ensure the CSS is found on Vercel's filesystem
  input: path.resolve(__dirname, 'global.css'),
  projectRoot: __dirname,
  inlineStyles: true,
});
