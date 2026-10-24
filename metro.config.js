// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// The Tanzil Quran text ships as a verbatim .txt asset (loaded at runtime, not inlined in JS).
config.resolver.assetExts.push('txt');

// three ≥ 0.186 made its CommonJS entry (`three.cjs`) call Node's `process.emitWarning`, which does
// not exist in React Native, so `require('three')` from @react-three/fiber/native crashed the app
// when the Kaaba screen loaded. Resolve the bare `three` import to its ES module build instead.
const threeModule = path.join(__dirname, 'node_modules/three/build/three.module.js');
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') return { type: 'sourceFile', filePath: threeModule };
  return resolveRequest ? resolveRequest(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
