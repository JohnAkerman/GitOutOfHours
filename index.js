'use strict'

const {spawn} = require('child_process');
const moment = require('moment');

const DATE_FORMAT_LOG = 'YYYY-MM-DD HH:mm:ss';
const TIME_FORMAT = 'HH:mm:ss';
const GIT_LOG_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss ZZ";

function getCommitHistory({dateData, author, skipTimeCheck}) {
	return new Promise((resolve, reject) => {
        const params = ['log'];

        // Testing this is not easily do-able as the git commit could be ran
        // any time of the day.

        /* istanbul ignore next */
        if (!skipTimeCheck) {
            params.push('--date=iso', `--since="${dateData.start}"`, `--until="${dateData.end}"`);
        }

        let logData = [];

        const git = spawn('git', params);

        git.stdout.on('data', data => {
            data = data.toString();

            let commits = data.split(/\n\nc/);

            commits = commits.map(c => {
                return {
                    author: c.match(/Author:\s([^<]+)?/)[1],
                    email: c.match(/<(.+)>/)[1],
                    date: c.match(/Date:\s*(.+)/)[1],
                    message: c.match(/\n\n\s*(.+)/)[1]
                };
            });

            parseCommitData(logData, commits, author);
        });

        git.stderr.on('data', data => {
            reject('Error retrieving commits');
        });

        git.on('exit', () => {
            resolve(logData)
        });
	});
}

function parseCommitData(logData, commits, author) {
    commits.forEach(commit => {
        // Filter by specific author
        if (author && commit.author && commit.author.toLowerCase().trim() !== author.toLowerCase().trim()) {
            return;
        }

        if (!commit.date) {
            return;
        }

        const current = moment(commit.date, GIT_LOG_DATE_FORMAT).format(DATE_FORMAT_LOG);
        
        if (!logData[current]) {
            logData[current] = {};
        }

        logData[current] = {
            author: commit.author.trim(),
            email: commit.email.trim(),
            message: commit.message.trim(),
            date: moment(commit.date, GIT_LOG_DATE_FORMAT).format(TIME_FORMAT)
        };
    });

    return logData;
}

function dateSelection(dayOffset) {
	const start = moment('05:30pm', 'HH:mm a');
	start.subtract(dayOffset, 'days');

	const end = moment('08:30am', 'HH:mm a');
	end.subtract(dayOffset - 1, 'days');

	return {
		start: start.format(DATE_FORMAT_LOG),
		end: end.format(DATE_FORMAT_LOG)
	};
}

async function runLogger(opts) {
	if (!opts.dayCount) {
        throw new Error('Amount of days to search for is required');
	}

    if (isNaN(opts.dayCount)) {
        throw new Error('Amount of days needs to be a number');
    }

    let outputString = `Getting the last ${pluralise(opts.dayCount, 'day')} commits`;

    if (opts.author) {
        outputString += ` by ${opts.author} `;
    }

    if (opts.skipTimeCheck == false) {
        outputString += ` after hours (5:30pm to 8:30am)`;
    }

    console.log(outputString);

    const promises = [];
	for (let i = 0; i < opts.dayCount; i++) {
        const dateData = dateSelection(i);
        promises.push(getCommitHistory({ dateData, author: opts.author, skipTimeCheck: opts.skipTimeCheck}));
    }

   return runHistoryPromises(promises, opts);
}

async function runHistoryPromises(promises, opts) {
    return Promise.all(promises)
        .then(async (logData) => {
            return await displayResults(logData, opts);
        })
        .catch((err) => { 
            if (err == "Error retrieving commits") {
                throw new Error(err);
            } else {
                return false;
            }
        });
}

async function displayResults(commitHistory, opts) {
    if (commitHistory == null) {
        throw new Error('No commit history found');
    }

    let newOutput = [];

    Object.keys(commitHistory).forEach(key => {
        if (commitHistory[key] == null) return false;

        Object.keys(commitHistory[key]).forEach(item => {
            if (commitHistory[key][item] !== null) {
                newOutput.push(commitHistory[key][item]);
            }
        });
    });

    if (newOutput.length > 0 && Object.keys(newOutput).length > 0) {
        console.table(newOutput, ['author', 'date', 'message']);
        if (opts.author) {
            console.log(`${opts.author} committed late ${pluralise(Object.keys(newOutput).length, 'time')} in the last ${pluralise(opts.dayCount, 'day')}`);
        } else {
            console.log(`${pluralise(Object.keys(newOutput).length, 'commit')} after hours were made in the last ${pluralise(opts.dayCount, 'day')}`);
        }
        return true;
    }
    return false;
}

function pluralise(val, str) {
	return (val === 1 ? val + ' ' + str : val + ' ' + str + 's');
}

async function gitoutofhours(opts) {
    if (typeof opts != "object") throw new Error("No parameter object specified");
    if (Object.keys(opts).length <= 0) throw new Error("No parameter values specified");

    return new Promise(async (resolve, reject) => {
        try {
            await runLogger(opts);
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { 
    gitoutofhours,
    displayResults,
    pluralise,
    runHistoryPromises,
    parseCommitData
};