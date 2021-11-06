'use strict'

const {spawn} = require('child_process');

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

        const current = formatDate(parseDate(commit.date));
        
        if (!logData[current]) {
            logData[current] = {};
        }

        logData[current] = {
            author: commit.author.trim(),
            email: commit.email.trim(),
            message: commit.message.trim(),
            date: parseDateIntoTime(commit.date)
        };
    });

    return logData;
}

function parseDateIntoTime(str) {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})\s(\d{1,2}):(\d{2}):(\d{2})/;
    const [, year, month, day, rawHour, min, secs] = datePattern.exec(str);
    return `${('0' + rawHour).slice(-2)}:${min}:${secs}`;
}

function parseDate(str) {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})\s(\d{1,2}):(\d{2}):(\d{2})/;
    const [, year, month, day, rawHour, min, secs] = datePattern.exec(str);
    return new Date(`${year}-${month}-${day}T${('0' + rawHour).slice(-2)}:${min}:${secs}`);
}

function formatDate(dt) {
    return(`${
        dt.getFullYear().toString().padStart(4, '0')}-${
        (dt.getMonth()+1).toString().padStart(2, '0')}-${
        dt.getDate().toString().padStart(2, '0')} ${
        dt.getHours().toString().padStart(2, '0')}:${
        dt.getMinutes().toString().padStart(2, '0')}:${
        dt.getSeconds().toString().padStart(2, '0')}`
    );
}

function dateSelection(dayOffset) {
    const start = new Date();
    start.setDate(start.getDate() - dayOffset);
    start.setHours(17);
    start.setMinutes(30);
    start.setMilliseconds(0);
    start.setSeconds(0);

    const end = new Date();
    end.setDate(end.getDate() - dayOffset + 1);
    end.setHours(8);
    end.setMinutes(30);
    end.setMilliseconds(0);
    end.setSeconds(0);

	return {
        start: formatDate(start),
        end: formatDate(end),
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