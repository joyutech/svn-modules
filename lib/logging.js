'use strict'

const chalk = require('chalk')

const MODULE_NAME = 'svn-modules'

// Will output debug information in production environments
module.exports.debug = function(line) {
  if (process.env.NODE_ENV === 'production')
    return

  console.log(`${MODULE_NAME} ${chalk.bgBlue.white('DEBUG')} ${line}`)
}

module.exports.success = function(line) {
  console.log(`${MODULE_NAME} ${chalk.bgGreen.black('OK')} ${line}`)
}

module.exports.info = function(line) {
  console.log(`${MODULE_NAME} ${line}`)
}

module.exports.warn = function(line) {
  console.log(`${MODULE_NAME} ${chalk.bgYellow.black('WARN')} ${line}`)
}

module.exports.error = function(line) {
  console.log(`${MODULE_NAME} ${chalk.bgRed.white('ERROR')} ${line}`)
}
