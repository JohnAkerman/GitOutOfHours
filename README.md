<h1 align="center">Git Out Of Hours</h1>

> View commit information on out of hours commits on a repo
<p align="center">
<a href="https://www.npmjs.com/package/gitoutofhours" target="_blank"><img alt="npm" src="https://img.shields.io/npm/v/gitoutofhours"></a>
<img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/JohnAkerman/GitOutOfHours">
<a href="https://github.com/JohnAkerman/GitOutOfHours/blob/master/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/JohnAkerman/GitOutOfHours"></a>

<img src="https://img.shields.io/github/languages/top/JohnAkerman/GitOutOfHours" alt="Top Language" />
  <a href="https://snyk.io/test/github/JohnAkerman/GitOutOfHours"><img src="https://snyk.io/test/github/JohnAkerman/GitOutOfHours/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/JohnAkerman/GitOutOfHours" style="max-width:100%;"></a>
</p>




## Install 
*Globally (recommended)*
```
$ npm i -g gitoutofhours
```

## Usage
After you've installed `gitoutofhours` globally you will be able to run it as a CLI application using the command line. 
```
$ gitoutofhours [daysInPast] [author](optional, in quotes)
```


Basic usage to establish how many commits were out of hours in the past week
```
$ gitoutofhours 7
```
<img src="media/example-usage.png" alt="Command prompt output showing git commits in a table" />

## Purpose
This tool can help gather information about repos where teh author commited work out of common office hours (between 5:30pm to 8:30am).
