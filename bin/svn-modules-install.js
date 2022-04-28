#! /usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync
const spawnSync = require('child_process').spawnSync

const program = require('commander')
const inquirer = require('inquirer')
const rimraf = require('rimraf')
const tar = require('tar')

const logger = require('../lib/logging')
const searchUpwards = require('../lib/search-upwards')

logger.info('Start to install svnDependencies')

let packageNames = []
program
  .arguments('[names...]')
  .action(names => packageNames = names.slice())
  .parse(process.argv)

inquirer
  .prompt([
    {
      name: 'username',
      message: 'svn username:',
    },
    {
      name: 'password',
      message: 'svn password:',
      type: 'password',
      mask: '*',
    }
  ]).then((results) => {
    let { username = '', password = '' } = results
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

    // Install the packages one-by-one
    for (let moduleName of Object.keys(svnDependencies)) {
      let item = svnDependencies[moduleName] || ''
      item = item.split('#')
      let repositoryUrl = item[0], revision = item[1]
      if(!repositoryUrl) {
        logger.error(`Unable to fetch ${moduleName}, no repositoryUrl`)
        continue;
      }
      let modulePath = path.join(svnModulesPath, moduleName)

      // Ensure the SVN modules folder exists
      if (!fs.existsSync(svnModulesPath))
        fs.mkdirSync(svnModulesPath)

      try {
        // If the package already exists in the local cache, delete it first
        if (fs.existsSync(modulePath))
          rimraf.sync(modulePath)
      } catch (err) {
        logger.warn(`Unable to delete ${moduleName} from local cache`)
      }

      // Fetch the package from SVN to the local cache
      logger.info(`Fetching ${moduleName}...`)
      let svnResult = spawnSync('svn', [ 'export',
        '--revision', revision ? revision : 'HEAD', // 如果指定，导出内容即为该版本，否则就是 HEAD 版本
        '--username', `${username}`, // 指定用户名称
        '--password', `${password}`, // 指定密码
        '--no-auth-cache',           // 不要缓存用户认证令牌
        '--non-interactive',         // 不要交互提示
        '--force',                   // 强制操作运行
        repositoryUrl,
        moduleName
      ], {
        cwd: svnModulesPath,
        env: process.env,
        stdio: 'pipe',
        encoding: 'utf8'
      })

      // If a SVN error occurred, report the error and skip this package
      if (svnResult.status !== 0) {
        if (svnResult.stderr && svnResult.stderr.includes('Authentication failed')) {
          logger.error('Svn username or password authentication failed')
        } else {
          logger.error(svnResult.stderr)
        }
        logger.error(`Unable to fetch ${moduleName}`)
        errorCount += 1
        continue
      }

      let tarModulePath = path.join(svnModulesPath, `${moduleName}.tgz`)
      tar.c(
        {
          file: tarModulePath,
          cwd: svnModulesPath,
          gzip: true,
          sync: true,
        },
        [ moduleName ],
      )

      try {
        // Install the package (and its dependencies) using NPM
        logger.info(`Installing ${moduleName}...`)
        execSync(`npm install --no-save "${tarModulePath}"`, {
          cwd: projectRoot,
          env: process.env,
          stdio: 'inherit'
        })

        successCount += 1
        logger.success(`Installed ${moduleName} successfully`)

      } catch (npmResult) {
        // If a NPM error occurred, report the error and skip this package
        if (npmResult.status !== 0) {
          logger.error(`Unable to install ${moduleName}`)
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

    // Report summary of installation
    if (errorCount === 0 && successCount > 0) {
      logger.success('All SVN dependencies were installed successfully')
    } else if (errorCount > 0) {
      logger.warn(`One or more SVN dependencies failed to install`)
      process.exit(1)
    }

    process.exit(0)
  })
  .catch((err) => {
    logger.error(err)
    process.exit(1)
  })
