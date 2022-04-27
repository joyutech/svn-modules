'use strict'

const chalk = require('chalk')

const MODULE_NAME = 'svn-modules'

// Will not output debug information in production environments
module.exports.debug = function(line) {
  if (process.env.NODE_ENV === 'production')
    return

  console.log(chalk.white(`[${MODULE_NAME}][D] ${line}`))
}

module.exports.success = function(line) {
  console.log(chalk.green(`[${MODULE_NAME}][S] ${line}`))
}

module.exports.info = function(line) {
  console.log(chalk.gray(`[${MODULE_NAME}][I] ${line}`))
}

module.exports.warn = function(line) {
  console.log(chalk.magenta(`[${MODULE_NAME}][W] ${line}`))
}

module.exports.error = function(line) {
  console.log(chalk.red(`[${MODULE_NAME}][E] ${line}`))
}
