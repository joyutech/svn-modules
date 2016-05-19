#! /usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const spawnSync = require('child_process').spawnSync

const chalk = require('chalk')
const program = require('commander')
const rimraf = require('rimraf')

const logger = require('../lib/logging')
const searchUpwards = require('../lib/search-upwards')

let packageNames = []

program
  .version('0.1.0')
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
let svnDependecies = packageInfo.svnDependecies || {}
if (!Object.keys(svnDependecies).length) {
  logger.warn('Package.json does not contain SVN dependencies')
  process.exit(0)
}

// Validate named packages, warn if they do not exist in the SVN dependencies
for (let packageName of packageNames) {
  if (!svnDependecies.hasOwnProperty(packageName))
    logger.warn(`Package.json does not contain SVN dependency '${packageName}'`)
}

// If individual package names were provided, filter out any non-matches
if (packageNames.length) {
  svnDependecies = Object.keys(svnDependecies)
    .filter(key => packageNames.indexOf(key) !== -1)
    .reduce((deps, key) => {
      deps[key] = svnDependecies[key]
      return deps
    }, {})
}

let successCount = 0
let errorCount = 0
let svnModulesPath = path.join(projectRoot, 'svn_modules')

// Install the packages one-by-one
for (let moduleName of Object.keys(svnDependecies)) {
  let repositoryUrl = svnDependecies[moduleName]
  let modulePath = path.join(svnModulesPath, moduleName)

  // Ensure the SVN modules folder exists
  if (!fs.existsSync(svnModulesPath))
    fs.mkdirSync(svnModulesPath)

  // If the package already exists in the local cache, delete it first
  if (fs.existsSync(modulePath))
    rimraf.sync(modulePath)

  // Fetch the package from SVN to the local cache
  logger.info(`Fetching ${moduleName}...`)
  let svnResult = spawnSync('svn', ['export', '--force', repositoryUrl, moduleName], {
    cwd: svnModulesPath,
    env: process.env,
    stdio: 'pipe',
    encoding: 'utf8'
  })

  // If a SVN error occurred, report the error and skip this package
  if (svnResult.status !== 0) {
    logger.error(`Unable to fetch ${moduleName}`)
    logger.error(svnResult.stderr)
    errorCount += 1
    continue
  }

  // Install the package (and its dependencies) using NPM
  logger.info(`Installing ${moduleName}...`)
  let npmResult = spawnSync('npm', ['install', modulePath], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit'
  })

  // If a NPM error occurred, report the error and skip this package
  if (npmResult.status !== 0) {
    logger.error(`Unable to install ${moduleName}`)
    logger.error(npmResult.stderr)
    errorCount += 1
    continue
  }

  successCount += 1
  logger.success(`Installed ${moduleName} successfully`)
}

// Report summary of installation
if (errorCount == 0 && successCount > 0) {
  logger.success('All SVN dependencies were installed successfully')
} else if (errorCount > 0) {
  logger.warn(`One or more SVN dependencies failed to install`)
}