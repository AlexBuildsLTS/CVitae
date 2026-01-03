const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Explicitly allow Metro to resolve CSS files
config.resolver.sourceExts.push('css');

// 2. Use a flat string for input and disable the recursive resolution
module.exports = withNativeWind(config, {
  input: 'global.css',
  projectRoot: __dirname,
  inlineStyles: true, // This forces styles to be inlined if file resolution fails
});
