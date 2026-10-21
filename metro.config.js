// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// The Tanzil Quran text ships as a verbatim .txt asset (loaded at runtime, not inlined in JS).
config.resolver.assetExts.push('txt');

module.exports = config;
