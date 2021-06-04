const execUpdates = require("./execUpdates")

/**
 * Retrieve a de-duplicated list of dependencies across all packages
 * @param {Object} params Function parameters
 * @param {Array<String>} params.packages An array of paths to packages
 * @param {Array<String>} [params.exclude] A list of dependencies to exclude
 * @param {Array<String>} [params.include] A list of dependencies to restrict
 * updates to (others will be ignored)
 * @param {Object} [params.constraints] A map of dependencies with a fixed
 * version that needs to be met
 * @return {Object} An map of dependencies names with available update and
 * old/new versions as well as whether version is constrained
 */
module.exports = async function getUpdates({
  packages,
  exclude = [],
  include = [],
  constraints = {},
}) {
  // Retrieve dependencies with available updates
  const availables = await Promise.all(
    packages.map((dir) =>
      // Retrieve dependencies with updates in current package
      execUpdates.call(this, {
        dir,
        exclude,
        include,
      })
    )
  )
  // De-duplicate results
  return availables.reduce((available, updates) => {
    for (let [dep, { old: oldV, new: newV }] of Object.entries(updates)) {
      // For each dependency with an update
      const isConstrained = Object.keys(constraints).includes(dep)
      if (isConstrained) newV = constraints[dep] // Use the right version
      if (!isConstrained || (isConstrained && oldV !== newV))
        // Only add constrained dependencies if their versions differ
        available[dep] = {
          // De-duplicate old versions across packages
          old:
            Object.keys(available).includes(dep) && available[dep].old !== oldV
              ? "various"
              : oldV,
          // Use constrained version if any, or available one
          new: newV,
          // Indicate if version is constrained
          isConstrained,
        }
    }
    return available
  }, {})
}
