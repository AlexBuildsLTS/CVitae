const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('css');

module.exports = withNativeWind(config, {
  // path.resolve creates an absolute path: /home/mirage/.../global.css
  input: path.resolve(__dirname, 'global.css'),
  projectRoot: __dirname,
  inlineStyles: true,
});
