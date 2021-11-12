#!/usr/bin/env node

import { findUpSync, pathExistsSync } from "find-up"
import { join } from "path"
import Module, { createRequire } from "module"
import update from "./src/index.js"
const require = createRequire(import.meta.url)

// Capture process arguments
const cliArgs = process.argv.slice(2)

// Retrieve user-defined configuration, which can be in the following
// locations:
// 	- the path to the config file passed by the --config argument
// 	- multi-updates.config.js file up in the tree from the current working
// 		directory
// 	- multi-updates.config.json file up in the tree from the current working
// 		directory
// 	- 'multiUpdates' entry in the package.json of the current npm package
const userConf = {}
const userConfPath = cliArgs.includes("--config")
  ? // If a specific configuration was passed, resolve its path from the
    // current working directory instead of from this file
    require.resolve(cliArgs[cliArgs.indexOf("--config") + 1], {
      paths: Module._nodeModulePaths(process.cwd()).concat([process.cwd()]),
    })
  : findUpSync((dir) =>
      pathExistsSync(join(dir, "multi-updates.config.js"))
        ? // First multi-updates.config.js if found
          join(dir, "multi-updates.config.js")
        : pathExistsSync(join(dir, "multi-updates.config.json"))
        ? // First multi-updates.config.json if found
          join(dir, "multi-updates.config.json")
        : // First package.json file with a 'multiUpdates' entry, if found
        pathExistsSync(join(dir, "package.json")) &&
          require(join(dir, "package.json")).multiUpdates
        ? join(dir, "package.json")
        : // Continue the search upward otherwise
          undefined
    )
if (userConfPath) {
  // If a user config file was found
  if (userConfPath.endsWith("package.json"))
    Object.assign(userConf, require(userConfPath).multiUpdates)
  else Object.assign(userConf, require(userConfPath))
}

// Define and retrieve CLI arguments and commands
require("yargs")
  .config(userConf) // Provide user conf from the default location
  .config() // Load other config file if provide with --config
  .command("$0", "Update dependencies in all packages", {}, (args) =>
    update(args)
  ).argv
