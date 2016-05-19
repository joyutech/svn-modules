#! /usr/bin/env node
'use strict'

const program = require('commander')

program
  .version('0.1.2')
  .command('install [names...]', 'install one or more SVN dependencies')
  .command('uninstall [names...]', 'uninstall one or more SVN dependencies')
  .parse(process.argv)
