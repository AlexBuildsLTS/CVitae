const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Explicitly allow Metro to resolve CSS files
config.resolver.sourceExts.push('css');

module.exports = config;
