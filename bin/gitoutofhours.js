#!/usr/bin/env node

const GitOutOfHours = require('../index.js');

if (process.argv.length === 2) { 
    console.error('No parameters given\nUsage: gitoutofhours [days in past] [author?]');
} else if (process.argv.length === 3) {
    GitOutOfHours.runLogger(process.argv[2]);
} else if (process.argv.length === 4) {
    GitOutOfHours.runLogger(process.argv[2], process.argv[3]);
} else {
    console.log('Something went wrong');
    exit(1);
}
