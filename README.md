<h1 align="center">Git Out Of Hours</h1>

<p align="center">
<a href="https://travis-ci.org/JohnAkerman/InvisionRipper"><img src="https://travis-ci.org/JohnAkerman/InvisionRipper.svg?branch=master" alt="Travis Build Status"></a> <a href="https://github.com/JohnAkerman/InvisionRipper/blob/master/LICENSE"><img src="https://img.shields.io/github/license/JohnAkerman/InvisionRipper.svg" alt="GitHub license"></a> <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="Standard - JavaScript Style Guide"></a>
  <a href="https://snyk.io/test/github/JohnAkerman/InvisionRipper"><img src="https://snyk.io/test/github/JohnAkerman/InvisionRipper/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/JohnAkerman/InvisionRipper" style="max-width:100%;"></a>
</p>

View commit information on out of hours commits on a repo


## Install 
*Globally (recommended)*
```
$ npm i -g gitoutofhours
```

## Usage
After you've installed `gitoutofhours` globally you will be able to run it as a CLI application using the command line. 
```
$ gitoutofhours [daysInPast] [author](optional)
```


Basic usage to establish how many commits were out of hours in the past week
```
$ gitoutofhours 7
```

## Purpose
This tool can help gather information about repos where teh author commited work out of common office hours (between 5:30pm to 8:30am).
