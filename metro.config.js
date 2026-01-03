const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('css');

module.exports = withNativeWind(config, {
  // Use a strictly relative path to stop NativeWind from prepending Vercel's root twice
  input: 'global.css',
  projectRoot: '.',
  inlineStyles: process.env.EXPO_PLATFORM !== 'web',
});
