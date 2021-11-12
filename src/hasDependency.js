import { join } from "path"
import { createRequire } from "module"
const require = createRequire(import.meta.url)

/**
 * Indicate whether a dependency is in a package
 * @param {String} pkgDir Path to the package's root
 * @param {String} dep The dependency
 * @return {Boolean} Whether the package has the supplied dependency
 */
export default function hasDependency(pkgDir, dep) {
  // Retrieve all dependencies of all types from package
  const { dependencies, devDependencies, peerDependencies } = require(join(
    pkgDir,
    "package.json"
  ))
  // Check if supplied dependency is in any of those
  return (
    (dependencies && Object.keys(dependencies).includes(dep)) ||
    (devDependencies && Object.keys(devDependencies).includes(dep)) ||
    (peerDependencies && Object.keys(peerDependencies).includes(dep))
  )
}
