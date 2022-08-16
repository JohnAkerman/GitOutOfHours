const {spawn} = require('child_process');

const DATE_FORMAT_LOG = 'YYYY-MM-DD HH:mm:ss';
const TIME_FORMAT = 'HH:mm:ss';
const GIT_LOG_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss ZZ";
const BOLD_START_CHARS = "\033[1m";
const BOLD_END_CHARS = "\033[0m";

function getCommitHistory({dateData, author, branch}) {
	return new Promise((resolve, reject) => {
        const params = ['log'];
        let logs = [];

        params.push('--date=iso', `--since="${dateData.start}"`, `--until="${dateData.end}"`);

        if (branch) {
            params.push(branch);
        }

        const git = spawn('git', params);

        git.stdout.on('data', data => {
            data = data.toString();

            let commits = data.split(/\n\nc/);

            commits = commits.map(c => {
                return {
                    hash: c.match(/ommit\s([a-z0-9]{40})?/)[1],
                    author: c.match(/Author:\s([^<]+)?/)[1],
                    email: c.match(/<(.+)>/)[1],
                    date: c.match(/Date:\s*(.+)/)[1],
                    message: c.match(/\n\n\s*(.+)/)[1]
                };
            });

            logs = parseCommitData(logs, commits, author);
        });

        git.stderr.on('data', () => reject('Error retrieving commits') );
        git.on('exit', () => resolve(logs));
	});
}

function parseCommitData(logs, commits, author) {
    commits.forEach(c => {
        // Filter by specific author
        if (author && c.author && c.author.toLowerCase().trim().includes(author.toLowerCase().trim()) == false) {
            return;
        }

        if (!c.date) {
            return;
        }

        const current = formatDate(parseDate(c.date));
        
        if (!logs[current]) {
            logs[current] = {};
        }

        logs[current] = {
            hash: c.hash.trim().slice(0, 7),
            author: c.author.trim(),
            email: c.email.trim(),
            message: c.message.trim(),
            date: parseDateIntoTime(c.date)
        };
    });

    return logs;
}

function parseDateIntoTime(str) {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})\s(\d{1,2}):(\d{2}):(\d{2})/;
    const [,,,, hour, min, secs] = datePattern.exec(str);
    return `${('0' + hour).slice(-2)}:${min}:${secs}`;
}

function parseDate(str) {
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})\s(\d{1,2}):(\d{2}):(\d{2})/;
    const result = datePattern.exec(str);
    const [, year, month, day, hour, min, secs] = result;
    return new Date(`${year}-${month}-${day}T${('0' + hour).slice(-2)}:${min}:${secs}`);
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

function dateSelection(dayOffset, skipTimeCheck) {
    const start = new Date();
    start.setDate(start.getDate() - dayOffset);

    if (skipTimeCheck === false) {
        start.setHours(17);
        start.setMinutes(30);
        start.setMilliseconds(0);
        start.setSeconds(0);
    }

    const end = new Date();
    end.setDate(end.getDate() - dayOffset + 1);
    
    if (skipTimeCheck === false) {
        end.setHours(8);
        end.setMinutes(30);
        end.setMilliseconds(0);
        end.setSeconds(0);
    }

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

    let outputString = `Getting the last ${BOLD_START_CHARS}${pluralise(opts.dayCount, 'day')}${BOLD_END_CHARS} commits`;

    if (opts.branch) {
        outputString += ` on branch ${BOLD_START_CHARS}${opts.branch}${BOLD_END_CHARS}`;
    }

    if (opts.author) {
        outputString += ` by ${BOLD_START_CHARS}${opts.author}${BOLD_END_CHARS}`;
    }

    if (opts.skipTimeCheck === false) {
        outputString += ` after hours (5:30pm to 8:30am)`;
    }

    console.log(outputString);

    const promises = [];
	for (let i = 0; i < opts.dayCount; i++) {
        const dateData = dateSelection(i, opts.skipTimeCheck);
        promises.push(getCommitHistory({ dateData, author: opts.author, skipTimeCheck: opts.skipTimeCheck, branch: opts.branch }));
    }

   return runHistoryPromises(promises, opts);
}

async function runHistoryPromises(promises, opts) {
    return Promise.all(promises)
        .then(async (logs) => {
            return await displayResults(logs, opts);
        })
        .catch((err) => { 
            if (err === "Error retrieving commits") {
                throw new Error(err);
            } else {
                return false;
            }
        });
}

async function displayResults(commits, opts) {
    let newOutput = [];

    if (commits === null) {
        throw new Error('No commit history found');
    }

    Object.keys(commits).forEach(key => {
        if (commits[key] === null) return false;

        Object.keys(commits[key]).forEach(item => {
            if (commits[key][item] !== null) {
                newOutput.push(commits[key][item]);
            }
        });
    });

    if (newOutput.length > 0 && Object.keys(newOutput).length > 0) {
        console.table(newOutput, ['hash', 'author', 'date', 'message']);
        if (opts.author) {
            console.log(`${BOLD_START_CHARS}${opts.author}${BOLD_END_CHARS} committed late ${BOLD_START_CHARS}${pluralise(Object.keys(newOutput).length, 'time')}${BOLD_END_CHARS} in the last ${BOLD_START_CHARS}${pluralise(opts.dayCount, 'day')}${BOLD_END_CHARS}`);
        } else {
            console.log(`${BOLD_START_CHARS}${pluralise(Object.keys(newOutput).length, 'commit')}${BOLD_END_CHARS} after hours were made in the last ${BOLD_START_CHARS}${pluralise(opts.dayCount, 'day')}${BOLD_END_CHARS}`);
        }
        return true;
    } else {
        console.log("No commits found with that criteria.");
    }
    return false;
}

function pluralise(val, str) {
	return (val === 1 ? `${val} ${str}` : `${val} ${str}s`);
}

async function gitoutofhours(opts) {
    if (typeof opts != "object") throw new Error("No parameter object specified");
    if (Object.keys(opts).length <= 0) throw new Error("No parameter values specified");

    return new Promise(async (resolve, reject) => {
        try {
            await runLogger(opts)
            .then(() => resolve())
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
    parseCommitData,
    parseDate
};