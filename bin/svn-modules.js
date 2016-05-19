#! /usr/bin/env node
'use strict'

const program = require('commander')

const VERSION_NUMBER = '0.1.5'

program
  .version(VERSION_NUMBER)
  .command('install [names...]', 'install one or more SVN dependencies')
  .command('uninstall [names...]', 'uninstall one or more SVN dependencies')
  .parse(process.argv)
