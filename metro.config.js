const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const workspaceRoot = path.resolve(__dirname, "../..");
const projectRoot = __dirname;

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

const blockPatterns = [
  new RegExp(
    path.join(workspaceRoot, "node_modules", ".pnpm").replace(/\\/g, "\\\\") +
      ".*_tmp_.*"
  ),
];

if (config.resolver.blockList) {
  if (Array.isArray(config.resolver.blockList)) {
    config.resolver.blockList = [...config.resolver.blockList, ...blockPatterns];
  } else {
    config.resolver.blockList = [config.resolver.blockList, ...blockPatterns];
  }
} else {
  config.resolver.blockList = blockPatterns;
}

module.exports = config;
