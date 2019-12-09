#!/usr/bin/env node
'use strict';
const gitoutofhours = require('../index.js');

if (process.argv.length === 2) {
	console.error('No parameters given\nUsage: gitoutofhours [days in past] [author?]');
} else if (process.argv.length === 3) {
	gitoutofhours.runLogger(process.argv[2]);
} else if (process.argv.length === 4) {
	gitoutofhours.runLogger(process.argv[2], process.argv[3]);
} else {
	console.log('Something went wrong');
	process.exit(1);
}
