// This file describes a sample configuration in a lerna monorepo, to
// demonstrate a configuration where:
// 	- we update dependencies across all the packages defines in the monorepo
// 	- we ignore local-only packages (lerna enables to symlink packages within a
// 		monorepo)
// 	- we set constraints on react-scripts dependencies, as it would otherwise
// 		complain if it found different versions in the monorepo's root

// eslint-disable-next-line node/no-missing-require
const { packages } = require("./lerna.json") // Source of truth
const { join } = require("path")
const { existsSync, lstatSync } = require("fs")
const glob = require("glob")
const { execSync } = require("child_process")

// Retrieve dependency versions constrained by react-scripts
const constrained = JSON.parse(
  execSync("npm view react-scripts dependencies --json", {
    encoding: "utf8",
    // Assumes react-scripts is used in the pacakge located at packages/www
    cwd: join(__dirname, "packages", "www"),
  })
)

// Export configuration
module.exports = {
  // Include monorepo's root and packages configured in lerna
  packages: ["./"].concat(packages),
  // Ignore local packages that depend on each other
  exclude: []
    .concat(
      ...packages.map((packageGlob) =>
        glob
          // Retrieve all paths matching glob, relative to lerna.json
          .sync(packageGlob)
          .map((dir) => join(process.cwd(), dir)) // Convert to absolute path
          .filter(
            // Keep packages only
            (dir) =>
              lstatSync(dir).isDirectory() &&
              existsSync(join(dir, "package.json"))
          )
      )
    )
    .map((dir) => require(join(dir, "package.json")).name),
  // Provide versions from react-scripts for certain devDependencies
  // as this creates conflicts otherwise
  constraints: Object.entries(constrained).reduce(
    (filtered, [dep, version]) => {
      if (["jest", "eslint"].includes(dep)) filtered[dep] = version
      return filtered
    },
    {}
  ),
}
