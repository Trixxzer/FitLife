const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const projectRoot = __dirname;
const mediapipePath = path.resolve(projectRoot, "react-native-mediapipe");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [mediapipePath];
config.resolver.blockList = exclusionList([
  new RegExp(`${mediapipePath.replace(/[/\\]/g, "[/\\\\]")}[/\\]node_modules[/\\].*`),
]);
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.join(projectRoot, "node_modules")];
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (_, name) => path.join(projectRoot, "node_modules", name),
  }
);

module.exports = config;
