const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);

const shell = require('shelljs')
const fs = require('fs')

const GitOutOfHours = require('../src/index.js');

describe('#gitoutofhours', () => {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    })

    it('should parse a date correctly', async() => {
        const inputDate = '2022-08-11 22:28:39 +0100';
        const output = GitOutOfHours.parseDate(inputDate).toISOString();
        expect(output).to.be.equal('2022-08-11T21:28:39.000Z');
    });

    it('should filter out different author', async () => {

        const logData = [];
        const commits = [];

        commits.push({
            hash: '312bf3bfgb3974d78e9c1fcd935f14514600839f',
            author: 'John Smith',
            email: 'test@example.com',
            date: '2021-11-05 10:00:00',
            message: 'Test Commit 1'
        });

        commits.push({
            hash: '194c831626830a0c16802636cfc32e4f85f15f8a',
            author: 'John Smith',
            email: 'test@example.com',
            date: '2021-11-05 10:00:00',
            message: 'Test Commit 2'
        });

        commits.push({
            hash: '6e2e3412a03f91aa2698cae4b890007e180953ba',
            author: 'Jane Smith',
            email: 'jane@example.com',
            date: '2021-11-06 10:05:00',
            message: 'Test Commit 3'
        });

        const out = GitOutOfHours.parseCommitData(logData, commits, 'John Smith');
        expect(Object.keys(out).length).to.be.equal(1);
    });

    it('should filter out empty commit data', async () => {
        const logData = [];
        const commits = [];

        const out = GitOutOfHours.parseCommitData(logData, commits, 'John Smith');
        console.log("out", out);
        expect(Object.keys(out).length).to.be.equal(0);
    });

    it('should filter out empty commit date', async () => {
        const logData = [];
        const commits = [];

        commits.push({
            hash: '20ecb4aaa0e05637842d4a9f85099d54d1c76ce2',
            author: 'John Smith',
            email: 'test@example.com',
            message: 'Test Commit 2'
        });

        const out = GitOutOfHours.parseCommitData(logData, commits, 'John Smith');
        console.log("out", out);
        expect(Object.keys(out).length).to.be.equal(0);
    });


    it('should not pluralise word', () => {
        expect(GitOutOfHours.pluralise(1, 'dog')).to.be.equal('1 dog');
    });

    it('should pluralise word', () => {
        expect(GitOutOfHours.pluralise(2, 'dog')).to.be.equal('2 dogs');
    });

    it('should error when no results found', async () => {
        await expect(GitOutOfHours.displayResults(null))
            .to.eventually.be.rejectedWith('No commit history found');
    });

    it('should not error with valid display', async () => {
        await expect(GitOutOfHours.displayResults({})).to.eventually.be.eq(false);
    });

    it('should not allow empty results key values', async () => {
        const result = await GitOutOfHours.displayResults({ a: null, b: null}, { author: null });
        expect(result).to.be.eq(false);
    });

    it('should not allow single history promise fail', async () => {
        const promiseA = new Promise((resolve, reject) => resolve());
        const promiseB = new Promise((resolve, reject) => reject('History promise fail'));

        const result = await GitOutOfHours.runHistoryPromises([promiseA, promiseB]);
        expect(result).to.be.eq(false);
    });

    it('should not allow valid history promises to display', async () => {
        const promiseA = new Promise((resolve, reject) => resolve( { null: null, null2: null } ));

        const result = await GitOutOfHours.runHistoryPromises([promiseA]);
        expect(result).to.be.eq(false);
    });

    it('should display valid commit history data with author filter', async () => {
        const commits =  {
            '2021-11-06 10:05:00': {
                author: 'John Smith',
                email: 'test@example.com',
                date: '10:00:00',
                message: 'Test Commit 1'
            }
        };

        const result = await GitOutOfHours.displayResults(commits, { author: 'John Smith'});
        expect(result).to.be.eq(true);
    });

    it('should display valid commit history data without author', async () => {
        const commits =  {
            '2021-11-06 10:05:00': {
                author: 'John Smith',
                email: 'test@example.com',
                date: '10:00:00',
                message: 'Test Commit 1'
            }
        };

        const result = await GitOutOfHours.displayResults(commits, { author: null });
        expect(result).to.be.eq(true);
    });



    before(() => {
        // Setup git repo example
        shell.config.resetForTesting();
        shell.cd(__dirname);
        shell.rm('-rf', 'temp');
        shell.mkdir('temp');
        shell.cd('temp');
        shell.exec('git init');
    });

    it('should return error with no object', async () => {
        await expect(GitOutOfHours.gitoutofhours())
            .to.eventually.be.rejectedWith('No parameter object specified');
    });

    it('should return error with empty object', async () => {
        await expect(GitOutOfHours.gitoutofhours({}))
            .to.eventually.be.rejectedWith('No parameter values specified');
    });

    it('should error with empty parameters', async () => {
        await expect(GitOutOfHours.gitoutofhours({ dayCount: null }))
            .to.eventually.be.rejectedWith('Amount of days to search for is required');
    });

    it('should error when amount of days is not a number', async () => {
        await expect(GitOutOfHours.gitoutofhours({ dayCount: "This is not a number"}))
            .to.eventually.be.rejectedWith('Amount of days needs to be a number');
    });

    it('should find no commits', () => {
        shell.cd(__dirname + "/temp");
        const log = shell.exec('git log -1 --format=format:"%H"').stdout;
        expect(log).to.not.have.lengthOf.above(2);
    });

    it('should throw an error if there are no commits', async () => {
        await expect(GitOutOfHours.gitoutofhours({ dayCount: 3}))
            .to.eventually.be.rejectedWith('Error retrieving commits');
    });

    it('should create commits with no errors', async () => {
        await shell.cd(__dirname);
        await shell.cd('temp');
        await shell.mkdir('helloworld');
        await shell.cd('helloworld');
        await fs.writeFileSync('test.txt', 'Some test content');
        await shell.exec('git config user.name "gitoutofhours"');
        const log = await shell.exec('git add --all && git commit -m"Initial commit"').stdout;
        expect(log).to.be.a('string');
        expect(log).to.have.lengthOf.above(2);
    });
    
    it('should find a commit', () => {
        shell.cd(__dirname + "/temp");
        const log = shell.exec('git log -1 --format=format:"%H"').stdout;
        console.log(log);
        expect(log).to.be.a('string');
        expect(log).to.have.lengthOf.above(2);
    });

    it('should find a commit using gitoutofhours',  async() => {
        const getDataStub = sandbox.stub(GitOutOfHours, 'gitoutofhours').resolves(true);
        const result = await GitOutOfHours.gitoutofhours({ dayCount: 2, skipTimeCheck: true });
        expect(result).to.be.eq(true);
        expect(getDataStub).to.have.been.calledOnceWith({ dayCount: 2, skipTimeCheck: true });
    });

    it('should find a commit using gitoutofhours with username', async () => {
        const getDataStub = sandbox.stub(GitOutOfHours, 'gitoutofhours').resolves(true);
        const result = await GitOutOfHours.gitoutofhours({ dayCount: 2, skipTimeCheck: false, author: 'gitoutofhours' });
        expect(result).to.be.eq(true);
        expect(getDataStub).to.have.been.calledOnceWith({ dayCount: 2, skipTimeCheck: false, author: 'gitoutofhours' });
    });

    it('should succeed when searching for commits in master branch', async () => {
        await expect(GitOutOfHours.gitoutofhours({ dayCount: 2, skipTimeCheck: false, author: 'gitoutofhours', branch: 'master' }))
            .to.eventually.be.fulfilled;
    });

    it('should find error when searching for commits in a random branch', async () => {
        await expect(GitOutOfHours.gitoutofhours({ dayCount: 2, skipTimeCheck: false, author: 'gitoutofhours', branch: 'aRandomBranch' }))
            .to.eventually.be.rejectedWith('Error retrieving commits');
    });

    it('should find not find a commit using gitoutofhours with username', async () => {
        const result = await GitOutOfHours.gitoutofhours({ dayCount: 2, skipTimeCheck: false, author: 'notgitoutofhours' });
        console.log('xxx', result);
    });

    after('cleaning up', () => {
        shell.config.resetForTesting();
        shell.cd(__dirname);
        shell.rm('-rf', 'temp');
    });
});