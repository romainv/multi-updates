import execUpdates from "./execUpdates.js"
import hasDependency from "./hasDependency.js"
import { exec } from "child_process"

/**
 * Install the selected updates
 * @param {Object} params The function parameters
 * @param {Array<String>} params.packages An array of paths to packages
 * @param {Object} params.dependencies A map of the dependencies to update,
 * indicated whether the update is contrained and if so, the version to set
 * @return {Array<String>} The name of the dependencies that were updated
 */
export default async function installUpdates({ packages, dependencies }) {
  // List if constrained dependencies
  const constrained = Object.entries(dependencies).reduce(
    (constrained, [dep, { isConstrained }]) => {
      if (isConstrained) constrained.push(dep)
      return constrained
    },
    []
  )
  // List of non constrained dependencies
  const nonConstrained = Object.keys(dependencies).filter(
    (dep) => !constrained.includes(dep)
  )
  // Run the update
  const updated = await Promise.all(
    packages.map(async (dir) => {
      let updated = [] // Will contain updated dependencies
      // Update non-constrained dependencies, if any
      if (nonConstrained.length > 0) {
        // If any dependency is non-constrained (we filter here as execUpdates
        // will either remove the --include filter if its length is 0, or fail
        // if no packages are found)
        const result = await execUpdates.call(this, {
          dir,
          update: true,
          include: nonConstrained,
        })
        // Keep track of which dependencies were updated
        updated = updated.concat(Object.keys(result))
      }
      // Update constrained dependencies present in current package
      for (const dep of constrained.filter(
        hasDependency.bind(undefined, dir)
      )) {
        // Update it in package.json
        await new Promise((res, rej) => {
          exec(
            `sed -i 's/"${dep}":\\s\\+"[^"]\\+"/"${dep}": "${dependencies[dep]["new"]}"/' package.json`,
            { cwd: dir }, // Execute command in current package's root
            (err, stdout) => (err ? rej(err) : res(stdout))
          )
        })
        updated.push(dep)
      }
      return updated
    })
  )
  // De-deduplicate dependencies
  return [...new Set([].concat.apply([], updated))]
}
