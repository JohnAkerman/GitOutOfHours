#!/usr/bin/env node
'use strict';
const { gitoutofhours } = require('../src/index.js');
const argv = require('yargs')
    .usage('Usage: [options]')
    .help('help')
    .alias('help', 'h')
    .option('days', {
        alias: 'd',
        description: 'How many days in the past to search for commits (higher number takes longer)',
        type: 'number',
        default: 30,
        demandOption: true
    })
    .option('author', {
        alias: 'a',
        description: 'Search for commits by particular author',
        type: 'string'
    })
    .option('anytime', {
        default: false,
        description: 'Search for commits any time of the day',
        type: 'boolean'
    })
    .option('branch', {
        alias: 'b',
        default: 'master',
        description: 'Search for commits in a particular branch',
        type: 'string'
    })
    .example('$0 -d 5 --author <name> --branch master').argv;

global.argv = argv;

gitoutofhours({
    dayCount: argv.days,
    author: argv.author,
    skipTimeCheck: argv.anytime,
    branch: argv.branch
}).then(() => process.exit(1)).catch(err => {
    console.error(err);
    process.exit(1);
});
