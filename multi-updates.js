#!/usr/bin/env node

import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { findUpSync, pathExistsSync } from "find-up"
import { join, resolve } from "path"
import { readFileSync } from "fs"
import update from "./src/index.js"

// Capture process arguments
const cliArgs = process.argv.slice(2)

/*
 * Retrieve user-defined configuration, which can be in the following
 * locations:
 * 	- the path to the config file passed by the --config argument
 * 	- multi-updates.config.js file up in the tree from the current working
 * 		directory
 * 	- multi-updates.config.json file up in the tree from the current working
 * 		directory
 * 	- 'multiUpdates' entry in the package.json of the current npm package
 * @param {Array} cliArgs The process arguments
 * @return {Object} The configuration
 */
async function getUserConf(cliArgs) {
  const userConf = {}
  const userConfPath = cliArgs.includes("--config")
    ? // If a specific configuration was passed, resolve its path from the
      // current working directory instead of from this file
      resolve(process.cwd(), cliArgs[cliArgs.indexOf("--config") + 1])
    : findUpSync((dir) =>
        pathExistsSync(join(dir, "multi-updates.config.js"))
          ? // First multi-updates.config.js if found
            join(dir, "multi-updates.config.js")
          : pathExistsSync(join(dir, "multi-updates.config.json"))
          ? // First multi-updates.config.json if found
            join(dir, "multi-updates.config.json")
          : // First package.json file with a 'multiUpdates' entry, if found
          pathExistsSync(join(dir, "package.json")) &&
            JSON.parse(readFileSync(join(dir, "package.json"))).multiUpdates
          ? join(dir, "package.json")
          : // Continue the search upward otherwise
            undefined
      )
  if (userConfPath) {
    // If a user config file was found
    if (userConfPath.endsWith("package.json"))
      Object.assign(
        userConf,
        JSON.parse(readFileSync(userConfPath)).multiUpdates
      )
    else {
      let imported = await import(userConfPath)
      if (imported.default) imported = imported.default
      Object.assign(userConf, imported)
    }
  }
  return userConf
}

// Define and retrieve CLI arguments and commands
;(async () => {
  const userConf = await getUserConf(cliArgs)
  yargs(hideBin(process.argv))
    .config(userConf) // Provide user conf from the default location
    .config() // Load other config file if provide with --config
    .command("$0", "Update dependencies in all packages", {}, (args) =>
      update(args)
    ).argv
})()
