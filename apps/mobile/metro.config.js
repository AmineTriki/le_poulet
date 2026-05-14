const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch workspace packages (packages/shared, packages/ui, etc.)
config.watchFolders = [workspaceRoot];

// Resolve node_modules from both the app and workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// TypeScript path alias: @/* → <projectRoot>/*  (matches tsconfig.json paths)
config.resolver.alias = {
  "@": projectRoot,
};

module.exports = config;
