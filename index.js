"use strict";

const ChildProcess = require("child_process");
const Spawn = ChildProcess.spawn;
const Moment = require("moment");
const GitLogParser = require("gitlog-parser").parse;

let commitHistory = {};
const DATE_FORMAT = "MMM D, YYYY";    
const TIME_FORMAT = "HH:mm:ss";

function getCommitHistory(dateData, author) {

    return new Promise((resolve, reject) => {
        GitLogParser(Spawn("git", ["log", "--since", dateData.start, "--until",  dateData.end]).stdout).on('commit', commit => {
            if (!commit) return;
            // Filter by specific author
            if (author && commit.author.name !== author) return;

            const current = Moment(commit.date).format(DATE_FORMAT);
            if (!commitHistory[current]) commitHistory[current] = {};

            if (!commitHistory[current].count) commitHistory[current].count = 0;
  
            commitHistory[current].count++;
            if (!commitHistory[current].details) commitHistory[current].details = [];
            
            commitHistory[current].details += `${Moment(commit.date).format(TIME_FORMAT)} - `;

        }).on("error", (err) => {
            console.error(err);
            reject(err)
        })
        .on("finish", () => {
            resolve();
        });
    });
}

function dateSelection(dayOffset) {
    const start = Moment('05:30pm', 'HH:mm a');
    start.subtract(dayOffset, "days");
    
    const end = Moment('08:30am', 'HH:mm a');
    end.subtract(dayOffset-1, "days");

    return {
        start,
        end
    }
}

async function runLogger(dayCount, author) {
    if (!dayCount) { console.error("Amount of days to search for is required"); return; }

    if (author) console.log(`Getting the last ${pluralise(dayCount, 'day')} commits by ${author} after hours (5:30pm to 8:30am)`);
    else console.log(`Getting the last ${pluralise(dayCount, 'day')} commits after hours (5:30pm to 8:30am)`);

    for (let i = 0; i < dayCount; i++) {
        const dateData = dateSelection(i);
        await getCommitHistory(dateData, author);
    }

    if (Object.keys(commitHistory).length > 0) {
        console.table(commitHistory);
    }

    if (author) console.log(`${author} committed late ${pluralise(Object.keys(commitHistory).length, 'time')} in the last ${pluralise(dayCount, 'day')}`);
    else console.log(`${pluralise(Object.keys(commitHistory).length, 'commit')} after hours were made in the last ${pluralise(dayCount, 'day')}`);
}

function pluralise(val, str) {
    return (val == 1 ? val + ' ' + str : val + ' ' + str + 's');
}

module.exports = {
    runLogger
}
