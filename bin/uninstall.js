#! /usr/bin/env node
'use strict'

const fs = require('fs')
const spawn = require('child_process').spawn

const chalk = require('chalk')
const program = require('commander')

const searchUpwards = require('../lib/search-upwards')

let packageNames = []

program
  .version('0.1.0')
  .arguments('[names...]')
  .action(names => packageNames = names.slice())
  .parse(process.argv)

console.log('Uninstalling SVN dependencies...')

for (let name of packageNames)
  console.log(`  ${chalk.red('Uninstalling')} ${name}`)

let packageJsonPath = searchUpwards('package.json')
let nodeModulesPath = searchUpwards('node_modules')

console.log(`package.json @ ${packageJsonPath}`)
console.log(`node_modules @ ${nodeModulesPath}`)
