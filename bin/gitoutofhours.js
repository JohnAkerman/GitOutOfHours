#!/usr/bin/env node
'use strict';
const { gitoutofhours } = require('../index.js');

switch (process.argv.length) {
    case 3:
	    gitoutofhours({ dayCount: process.argv[2]})
            .then(result => console.log("Case 3 Result", result)).catch(err => console.error(err));
        break;

    case 4:
	    gitoutofhours({ dayCount: process.argv[2], author: process.argv[3]})
            .then(result => console.log("Case 4 Result", result)).catch(err => console.error(err));
        break;

    case 5:
        gitoutofhours({
            dayCount: process.argv[2],
            author: process.argv[3],
            skipTimeCheck: process.argv[4]
        }).then(result => console.log("Case 5 Result", result)).catch(err => console.error(err));
        break;

    default:
        process.stderr.write('No parameters given\nUsage: gitoutofhours [days in past] [author?]');
        process.exit(1);
        break;
}
