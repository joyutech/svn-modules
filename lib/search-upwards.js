'use strict'

const fs = require('fs')
const path = require('path')

const ROOT_DIRECTORY_REGEX = /^(\w:\\|\/)$/i

// Attempts to find a file or directory, walking up the parent directories
// If the path is found, the full file path is returned
// If the path is NOT found, null is returned
module.exports = function searchUpwards(fileOrDirectory, currentDirectory) {
  currentDirectory = currentDirectory || process.cwd()
  let fullPath = path.join(currentDirectory, fileOrDirectory)

  // Check if the file or directory exists
  if (fs.existsSync(fullPath))
    return fullPath

  // If we are root, return null since we cannot recurse further
  if (ROOT_DIRECTORY_REGEX.test(currentDirectory))
    return null

  // Try to find the file or directory in the parent directory (recursive)
  let parentDirectory = path.resolve(currentDirectory, '..')
  return searchUpwards(fileOrDirectory, parentDirectory)
}
