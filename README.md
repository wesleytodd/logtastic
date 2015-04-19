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
var log = require('logtastic');

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

The basic features of logging are provided by [loggerr](https://github.com/wesleytodd/loggerr), so anything that is possible on a `Loggerr` instance is also available on a `Logtastic` instance.

## Customizing & Creating Your Own

The main package exports an instance of Logtastic with the default settings.  Usually you will just need to tweak the settings a bit to your needs.  For example, here we change the output files and log level:

```javascript
var log = require('logtastic');
log.outfile = path.join('logs', 'stdout.log');
log.errfile = path.join('logs', 'stderr.log');
log.level = log.INFO;
```

To create your own instances of Logtastic it is recommended that you include the logger directly:

```javscsript
var Logtastic = require('logtastic/Logger');
var log = new Logtastic({
	level: log.INFO,
	parseArgv: false
});
```

This circumvents the creation of the default logger and allows you to do things like disabling the argv parsing.

## CLI Arguments

Logtastic will parse the cli args by default, using [minimist](https://github.com/substack/minimist).  The args are as follows:

- `--logLevel -l`: Sets the log level, ex: `--logLevel=info`.  This is overridden if either `verbose` or `silent` are specified.
- `--debug`: Sets the log level to debug
- `--verbose -v`: Sets the log level to info
- `--silent -s`: Sets the log level to silent (`-1`)
- `--logToFile -f`: Force logs to be directed to the log files

If these arguments conflict with something else in your application you can easily override them with creating your logger instance (see [minimist docts](https://github.com/substack/minimist) for details):

```
var Logger = require('logtastic/Logger');

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

A special middleware generator function is provided for doing http logging.  All configurations setup for the logger is used in the middleware, so mostly all you have to do is call it with an express `use` call:

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

Logtastic can easily log uncaught exceptions for you:

```javascript
log.logUncaught();
```

By default logtastic will log `emergency` for `uncaughtException` events.  This can be changed by passing a log level to `logUncaught`:

```javascript
log.logUncaught(log.CRITICAL);
```

This method returns a function that will remove the listener.  If you need to disable it during runtime you can do so with that.
