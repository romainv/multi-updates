import colors from "ansi-colors" // Dependency of enquirer
import getUpdates from "./getUpdates.js"
import selectUpdates from "./selectUpdates.js"
import installUpdates from "./installUpdates.js"
import glob from "glob"
import { join } from "path"
import { existsSync, lstatSync } from "fs"

/**
 * Update dependencies across multiple packages, satisfying constraints
 * @param {Object} params Function parameters
 * @param {Array<String>} params.packages An array of globs to packages
 * @param {Array<String>} [params.exclude] A list of dependencies to exclude
 * @param {Array<String>} [params.include] A list of dependencies to restrict
 * updates to (others will be ignored)
 * @param {Object} [params.constraints] A map of dependencies with a fixed
 * version that needs to be met
 * @param {String} [params.cwd] Path to the directory from which to resolve
 * packages path
 */
export default async function update({
  packages = ["./"],
  exclude = [],
  include = [],
  constraints = {},
  cwd = process.cwd(),
}) {
  // Resolve packages globs
  packages = [].concat(
    ...packages.map((packageGlob) =>
      glob
        .sync(packageGlob, { cwd }) // Retrieve all paths matching glob
        .map((dir) => join(cwd, dir)) // Convert to absolute path
        .filter(
          // Keep packages only
          (dir) =>
            lstatSync(dir).isDirectory() &&
            existsSync(join(dir, "package.json"))
        )
    )
  )
  // Collect available updates for non-constrained dependencies
  const available = await getUpdates.call(this, {
    packages,
    include,
    exclude,
    constraints,
  })
  if (Object.keys(available).length === 0) {
    // If no updates are available
    console.log(
      `${colors.bold.black.bgGreen("  OK  ")} All dependencies in ${
        packages.length > 1 ? `${packages.length} packages` : "package"
      } are up-to-date`
    )
    return
  }
  // Ask user which updates to install (fails if no updates selected)
  const selected = await selectUpdates.call(this, available)
  if (Object.keys(selected).length === 0) {
    // If no updates were selected
    console.log(`${colors.bold.white.bgBlue(" INFO ")} No updates selected`)
    return
  }
  // Install updates
  const updated = await installUpdates.call(this, {
    packages,
    dependencies: selected,
  })
  // Confirmation message
  console.log(
    `${colors.bold.black.bgGreen("  OK  ")} Updated ${
      updated.length
    } dependencies in ${packages.length} package${
      packages.length > 1 ? "s" : ""
    }`
  )
  // Note: this script does note cover execution of npm install
  console.log("Please run 'npm install' to install the updated dependencies")
}
