import { join, dirname } from "path"
import { exec } from "child_process"
import hasDependency from "./hasDependency.js"
import { createRequire } from "module"
const require = createRequire(import.meta.url)
// Location of the updates binary. We won't be able to use 'npx updates' as
// we'll run this in various packages which may not have this dependency
const updatesPkg = require.resolve("updates/package.json")
const updatesBin = join(
  dirname(updatesPkg),
  typeof require(updatesPkg).bin === "string"
    ? require(updatesPkg).bin
    : require(updatesPkg).bin.updates
)

/**
 * Execute the updates command in the supplied directory and return the
 * dependencies with available updates
 * @param {Object} params Function parameters
 * @param {String} params.dir The directory in which to run the command (i.e.
 * the module to update)
 * @param {Boolean} [param.update=false] If true, will update the dependencies
 * and the module's package.json. By default, it only checks for available
 * updates
 * @param {Array<String>} [params.exclude] A list of dependencies to exclude
 * @param {Array<String>} [params.include] A list of dependencies to include,
 * i.e. any other dependencies will be ignored
 * @return {Object} An map of dependencies names with available update and
 * old/new versions
 */
export default async function execUpdates({
  dir,
  update = false,
  exclude: excludeArg = [],
  include: includeArg = [],
}) {
  // Filter out from exclude and include the dependencies that are not in the
  // package, as the updates binary throws an error otherwise
  const include = includeArg.filter(hasDependency.bind(undefined, dir))
  const exclude = excludeArg.filter(hasDependency.bind(undefined, dir))
  if (includeArg.length > 0 && include.length === 0)
    // If there were restrictions on which dependencies to process, but none
    // are in the current repo, don't proceed further
    return {}
  else {
    // Retrieve info on dependencies processed by updates
    const { results, error } = await new Promise((res, rej) => {
      exec(
        `${updatesBin} --json ${update ? "-u" : ""}` +
          (exclude.length > 0
            ? ` --exclude ${exclude.map((dep) => `"${dep}"`).join(",")}`
            : "") +
          (include.length > 0
            ? ` --include ${include.map((dep) => `"${dep}"`).join(",")}`
            : ""),
        { cwd: dir }, // Execute command in current package's root
        (err, stdout) => {
          try {
            // Attempt to return the result or the formatted error from the CLI
            res(JSON.parse(stdout))
          } catch (err2) {
            // If parsing failed, throw the first error that occured
            rej(err || err2)
          }
        }
      )
    })
    if (error) {
      if (
        error.startsWith("Error: No packages match the given filters") ||
        error.startsWith("Error: No packages found")
      )
        // Happens when all package dependencies have been excluded, or a
        // package has no dependencies
        return {}
      else throw new Error(error)
    }
    // Flatten dependency types
    else
      return Object.values(results).reduce(
        (flattened, deps) => Object.assign(flattened, deps),
        {}
      )
  }
}
