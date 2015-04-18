# Logtastic

A logger with the features you need for your app:

- Log levels
- Log to console or file
- Parse arguments to set logging options
- Log uncaught exceptions
- Express style middleware to log http requests


## Install

```
$ npm install --save logtastic
```

## Basic Usage

```javascript
var Logger = require('logtastic');

var log = new Logger();
log.error(new Error('My error message'));
/*
output: Thu Apr 16 2015 22:05:27 GMT-0500 (CDT) [error] - {"msg":"Error: My error message\n<STACK TRACE>"}
*/
log.info('Something happened', {
	foo: 'info about what happened'
});
/*
output: Thu Apr 16 2015 22:05:27 GMT-0500 (CDT) [info] - {"msg":"Something happened","foo":"info about what happened"}
*/

// Express middleware
var app = require('express')();
app.use(log.middleware());
/*
On request: Thu Apr 16 2015 22:05:27 GMT-0500 (CDT) [info] - {"msg":"127.0.0.1 http GET / 200 Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:37.0) Gecko/20100101 Firefox/37.0"
*/
```

The basic features of logging are provided by [loggerr](https://github.com/wesleytodd/loggerr), so anything that is possiable on a `Loggerr` instance is also available on a `Logtastic` instance.

## CLI Arguments

Logtastic will parse the cli args by default, using [minimist](https://github.com/substack/minimist).  The args are as follows:

- `--logLevel -l`: Sets the log level, ex: `--logLevel=info`.  This is overridden if either `verbose` or `silent` are specified.
- `--debug`: Sets the log level to debug
- `--verbose -v`: Sets the log level to info
- `--silent -s`: Sets the log level to silent (`-1`)
- `--logToFile -f`: Force logs to be directed to the log files

If these arguments conflict with something else in your application you can eaisly override them with creating your logger instance (see [minimist docts](https://github.com/substack/minimist) for details):

```
var logger = new Logger({
	parseArgv: {
		string: [
			'logLevel'
		],
		boolean: [
			'noCli',
			'logToFile',
			'debug',
			'verbose',
			'silent'
		],
		alias: {
			// Dont alias logToFile to f
			//f: 'logToFile',
			// or logLevel to l
			//l: 'logLevel',
			// But still alias -v and -s
			v: 'verbose',
			s: 'silent'
		}
	}
});
```

NOTE: you need to override the whole minimist options arguments, no merging occurs.  The above is default if you remove the comments.

## Middleware

A special middleware generator function is provided for doing http logging.  All configurations setup for the logger is used in the middleware, so mostly all you ahve to do is call it with an express `use` call:

```javascript
var Logger = require('logtastic'),
	app = require('express')();

var logger = new Logger({
	// Custom options
});

app.use(logger.middleware());
```

If you need to you can configure the middleware function in two ways, change the level at which it logs and if it should log before or after the request is processed.  These can be specified as such:

```javascript
app.use(logger.middleware({
	// Log before the request is processed
	immediate: true,
	// Use the log level debug to log
	level: Logger.DEBUG
}))
```

## Uncaught Exceptions

By default logtastic will log `emergency` for all `uncaughtException` events.  This can be disabled or changed with the `logUncaught` option:

```
// Disable entirely
var logger = new Logger({
	logUncaught: false
});

// Log level error
var logger = new Logger({
	logUncaught: Logger.ERROR
});

```
