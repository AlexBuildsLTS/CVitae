const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// We must use a relative path string here to prevent Vercel
// from nesting the project root inside the cache path.
module.exports = withNativeWind(config, { input: 'global.css' });
