#! /usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync
const spawnSync = require('child_process').spawnSync

const program = require('commander')
const rimraf = require('rimraf')

const logger = require('../lib/logging')
const searchUpwards = require('../lib/search-upwards')

let packageNames = []

program
  .arguments('[names...]')
  .action(names => packageNames = names.slice())
  .parse(process.argv)

// Search for package.json to determine project root
let packageJsonPath = searchUpwards('package.json')
let projectRoot = path.dirname(packageJsonPath)

// If no package.json was found, report the error and exit
if (!packageJsonPath) {
  logger.error('Unable to find package.json')
  process.exit(1)
}

// Attempt to read/parse package.json for SVN dependencies
let packageInfo = {}
try {
  let rawData = fs.readFileSync(packageJsonPath, 'utf8')
  packageInfo = JSON.parse(rawData)
} catch (err) {
  logger.error('Unable to read or parse package.json')
  process.exit(1)
}

// If there are no SVN dependencies, warn and exit
let svnDependencies = packageInfo.svnDependencies || {}
if (!Object.keys(svnDependencies).length) {
  logger.warn('Package.json does not contain SVN dependencies')
  process.exit(0)
}

// Validate named packages, warn if they do not exist in the SVN dependencies
for (let packageName of packageNames) {
  if (!svnDependencies.hasOwnProperty(packageName))
    logger.warn(`Package.json does not contain SVN dependency '${packageName}'`)
}

// If individual package names were provided, filter out any non-matches
if (packageNames.length) {
  svnDependencies = Object.keys(svnDependencies)
    .filter(key => packageNames.indexOf(key) !== -1)
    .reduce((deps, key) => {
      deps[key] = svnDependencies[key]
      return deps
    }, {})
}

let successCount = 0
let errorCount = 0
let svnModulesPath = path.join(projectRoot, 'svn_modules')

// Uninstall the packages one-by-one
for (let moduleName of Object.keys(svnDependencies)) {
  let modulePath = path.join(svnModulesPath, moduleName)

  try {
    // Uninstall the package (and its dependencies) using NPM
    logger.info(`Uninstalling ${moduleName}...`)
    execSync(`npm uninstall ${moduleName}`, {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit'
    })

    successCount += 1
    logger.success(`Uninstalled ${moduleName} successfully`)

  } catch (npmResult) {
    // If a NPM error occurred, report the error and skip this package
    if (npmResult.status !== 0) {
      logger.error(`Unable to uninstall ${moduleName}`)
      errorCount += 1
      continue
    }
  }
}

// Delete local cache (svn_modules)
try {
  if (fs.existsSync(svnModulesPath))
    rimraf.sync(svnModulesPath)
} catch (err) {
  logger.warn(`Unable to delete local cache`)
}

// Report summary of uninstall
if (errorCount === 0 && successCount > 0) {
  logger.success('All SVN dependencies were uninstalled successfully')
} else if (errorCount > 0) {
  logger.warn(`One or more SVN dependencies failed to uninstall`)
  process.exit(1)
}

process.exit(0)
