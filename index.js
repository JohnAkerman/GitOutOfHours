const {spawn} = require('child_process');
const moment = require('moment');

const commitHistory = [];
const DATE_FORMAT_LOG = 'YYYY-MM-DD HH:mm:ss';
const TIME_FORMAT = 'HH:mm:ss';

function getCommitHistory(dateData, author) {
	return new Promise((resolve, reject) => {
		const git = spawn('git', ['log', '--date=rfc', '--since', dateData.start, '--until', dateData.end]);

		git.stdout.on('data', data => {
			data = data.toString();

			let commits = data.split(/\n\nc/);

			commits = commits.map(c => {
				c = c.startsWith('c') ? c : 'c' + c;

				return {
					author: c.match(/Author:\s([^<]+)?/)[1],
					email: c.match(/<(.+)>/)[1],
					date: c.match(/Date:\s*(.+)/)[1],
					message: c.match(/\n\n\s*(.+)/)[1]
				};
			});

			commits.forEach(commit => {
				if (!commit) {
					return;
				}

				// Filter by specific author
				if (author && commit.author.toLowerCase().trim() !== author.toLowerCase().trim()) {
					return;
				}

				const current = moment(commit.date).format(DATE_FORMAT_LOG);

				if (!commitHistory[current]) {
					commitHistory[current] = {};
				}

				commitHistory[current] = {
					author: commit.author.trim(),
					email: commit.email.trim(),
					message: commit.message.trim(),
					date: moment(commit.date).format(TIME_FORMAT)
				};
			});
		});

		git.stderr.on('data', data => {
			console.error('Error retreiving commits', data.toString());
			reject(data.toString());
		});

		git.on('exit', () => resolve());
	});
}

function dateSelection(dayOffset) {
	const start = moment('05:30pm', 'HH:mm a');
	start.subtract(dayOffset, 'days');

	const end = moment('08:30am', 'HH:mm a');
	end.subtract(dayOffset - 1, 'days');

	return {
		start,
		end
	};
}

async function runLogger(dayCount, author) {
	if (!dayCount) {
		console.error('Amount of days to search for is required');
		return;
	}

	if (author) {
		console.log(`Getting the last ${pluralise(dayCount, 'day')} commits by ${author} after hours (5:30pm to 8:30am)`);
	} else {
		console.log(`Getting the last ${pluralise(dayCount, 'day')} commits after hours (5:30pm to 8:30am)`);
	}

	for (let i = 0; i < dayCount; i++) {
		const dateData = dateSelection(i);
		await getCommitHistory(dateData, author); // TODO: Update this to avoid await in loop and instead create promises
	}

	if (Object.keys(commitHistory).length > 0) {
		console.table(commitHistory, ['author', 'message']);
	}

	if (author) {
		console.log(`${author} committed late ${pluralise(Object.keys(commitHistory).length, 'time')} in the last ${pluralise(dayCount, 'day')}`);
	} else {
		console.log(`${pluralise(Object.keys(commitHistory).length, 'commit')} after hours were made in the last ${pluralise(dayCount, 'day')}`);
	}
}

function pluralise(val, str) {
	return (val === 1 ? val + ' ' + str : val + ' ' + str + 's');
}

module.exports = {
	runLogger
};
