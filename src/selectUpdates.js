const colors = require("ansi-colors")
const { prompt } = require("enquirer")

/**
 * Interactive command prompt asking user to select dependencies to update
 * amongst available updates
 * @param {Object} available An object whose keys are dependencies and values
 * contain information on the dependency - including new and old value
 * @return {Object} A filtered copy of the provided object, with only the
 * selected updates
 */
module.exports = async function selectUpdates(available) {
  // Print formatted output
  const widths = [
    // Column widths defined by the max length of their respective contents
    Math.max(...Object.keys(available).map((dep) => dep.length)),
    Math.max(...Object.values(available).map(({ old: oldV }) => oldV.length)),
    Math.max(...Object.values(available).map(({ new: newV }) => newV.length)),
  ]
  // Reduce space between columns depending on available terminal width
  const space = Math.max(
    1, // Minimum 1 whitespace for lisibility
    Math.min(
      5, // Maximum 5 whitespaces
      Math.floor(
        (process.stdout.columns - // Available terminal width
          4 - // Extra characters added by Prompt
          widths.reduce((colA, colB) => colA + colB, 0)) / // Content width
          3 // 3 columns
      )
    )
  )
  const { selected } = await prompt({
    type: "multiselect",
    name: "selected",
    message: `${
      Object.keys(available).length
    } updates available: which ones to install?`,
    choices: Object.keys(available)
      .sort()
      .map((dep) => {
        const { old: oldV, new: newV, isConstrained } = available[dep]
        const name = dep + (isConstrained ? " \uf023" : "") // Add a lock icon
        return {
          name:
            name +
            fill(name, widths[0], space) +
            colorize(oldV, newV, "yellow") +
            fill(oldV, widths[1], space) +
            colorize(newV, oldV, "green"),
          value: dep,
        }
      }),
    // Return a mapping between displayed choices and values (dependencies)
    result(names) {
      return this.map(names)
    },
  })
  // Return a filtered-version of the provided object
  return Object.values(selected).reduce((res, dep) => {
    res[dep] = available[dep]
    return res
  }, {})
}

/**
 * Add a color starting at the first character that is different between str1
 * and str2
 * @param {String} str1 The string to modify
 * @param {String} str2 The string to compare it against
 * @param {String} colorCode The color code
 * @return {String} The formatted string
 */
function colorize(str1, str2, colorCode) {
  let colorized = "" // Will contain the colorized version
  for (let index = 0, chr = ""; (chr = str1.charAt(index)); index++) {
    // Don't colorize the string as long as it matches the reference
    if (chr === str2.charAt(index)) colorized += chr
    // Colorize the rest of the string as soon as it differs
    else {
      colorized += colors[colorCode](str1.substring(index, str1.length))
      break // Stop checking each character
    }
  }
  return colorized
}

/**
 * Generate empty spaces to fill a colum
 * @param {String} content The column's content at a particular row
 * @param {Integer} colWidth The column's width
 * @param {Integer} [colSpace=5] The space between columns
 * @return {String} A string of empty spaces to use to fill the column to the
 * right length
 */
function fill(content, colWidth, colSpace = 5) {
  return " ".repeat(colWidth - content.length + colSpace)
}
