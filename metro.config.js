const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para soportar archivos WASM de expo-sqlite en web
config.resolver.assetExts.push('wasm');

module.exports = config;
