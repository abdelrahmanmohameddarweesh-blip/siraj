const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase 9's native Auth entry is CommonJS, while firebase/app is ESM.
// Package exports can resolve @firebase/app to two different registries.
// Use Firebase's legacy entry fields consistently so Auth registers on the
// same app instance. Keep modern package exports for all other libraries.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isFirebase = moduleName.startsWith('firebase/') || moduleName.startsWith('@firebase/');
  return context.resolveRequest(
    isFirebase ? { ...context, unstable_enablePackageExports: false } : context,
    moduleName,
    platform,
  );
};

module.exports = config;
