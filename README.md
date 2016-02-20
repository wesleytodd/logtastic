# Logtastic

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status](https://travis-ci.org/wesleytodd/logtastic.svg?branch=master)](https://travis-ci.org/wesleytodd/logtastic)
[![js-happiness-style](https://img.shields.io/badge/code%20style-happiness-brightgreen.svg)](https://github.com/JedWatson/happiness)

A logger with the features you need for your "Universal" javascript web app:

- Log levels
- Customizable output streams by log level
- Parse arguments to set logging options in node apps
- Log uncaught exceptions (in both browser and node)
- Express style middleware to log http requests
- Log to a server endpoint in the browser
- Add data to all logs globally (ex. `process.pid` or `window.navigator.userAgent`)
- Customizeable log formats

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
```

The basic features of logging are provided by [loggerr](https://github.com/wesleytodd/loggerr), so anything that is possible on a `Loggerr` instance is also available on a `Logtastic` instance.

## Customizing & Creating Your Own

The main package exports an instance of Logtastic with the default settings.  Usually you will just need to tweak the settings a bit to your needs.  For example, here we change the sever log function and the level:

```javascript
var log = require('logtastic');
var xhr = require('xhr');
log.level = log.INFO;

log.serverLog = function (msgs, done) {
	// Send logs with a GET request and jsut as a raw array
	xhr({
		method: 'GET',
		url: options.serverLog,
		json: msgs
	}, function (err, resp, body) {
		if (err) {
			return done(err);
		}
		if (resp.statusCode >= 400) {
			return done(new Error('Failed to send log to server: got status ' + resp.statusCode));
		}
		done();
	});
};
```

To create your own instances of Logtastic you can just use the constructor like this:

```javscsript
var Logtastic = require('logtastic').Logtastic;
var log = new Logtastic({
	level: log.INFO,
	serverLog: '/api/log'
});
```

This circumvents the creation of the default logger and allows you to do things like disabling the argv parsing.

## Logging browser errors to the server

Logtastic can log errors that happen in the browser to an api.  This is helpful for your production apps when you want to be notified of the errors your users are having.  You can do this one of two ways, specifying a url to POST to, or specifying a function that will do the sending.  The basic way of specifying a url looks like this:

```javascript
log.serverLog = '/api/log';
log.error(new Error('foobar'));

/*
This will send the following request:

POST /api/log
{
  "messages": ["Thu Apr 16 2015 22:05:27 GMT-0500 (CDT) [error] - {"msg":"Error: foobar\n<STACK TRACE>"}"]
}
*/
```

If you want to do more than just post them to the server as an array you can fully override this functionality by setting `serverLog` to a function with the signature `function (messages, done)`.

The browser logger can also batch send log messages to reduce server load.  To use this feature you can set either of two options:

```
log.bufferFlushSize = 5; // This is the number of logs to buffer before sending
log.bufferFlushInterval = 5000; // This is the number of milliseconds after which the buffer will flush even if bufferFlushSize isnt reached
```

## CLI Arguments

Logtastic can parse the cli args, using [minimist](https://github.com/substack/minimist).  The args are as follows:

- `--logLevel -l`: Sets the log level, ex: `--logLevel=info`.  This is overridden if either `verbose` or `silent` are specified.
- `--debug`: Sets the log level to debug
- `--verbose -v`: Sets the log level to info
- `--silent -s`: Sets the log level to silent (`-1`)

Logtastic will only parse the logs if you tell it to, usually you will do the following in your main entry point script:

```javascript
var log = require('logtastic');
log.parseArgs();
```

If these arguments conflict with something else in your application you can easily override them with creating your logger instance (see [minimist docts](https://github.com/substack/minimist) for details):

```javascript
var Logger = require('logtastic').Logtastic;

var logger = new Logger({
	parseArgv: {
		string: [
			'logLevel'
		],
		boolean: [
			'noCli',
			'debug',
			'verbose',
			'silent'
		],
		alias: {
			// Dont alias logLevel to l
			//l: 'logLevel',
			// But still alias -v and -s
			v: 'verbose',
			s: 'silent'
		}
	}
});

logger.parseArg();
```

NOTE: you need to override the whole minimist options arguments, no merging occurs.

## Middleware

A special middleware generator function is provided for doing http logging.  All configurations setup for the logger is used in the middleware, so mostly all you have to do is call it with an express `use` call:

```javascript
var log = require('logtastic'),
	app = require('express')();

app.use(log.middleware());
/*
On request: Thu Apr 16 2015 22:05:27 GMT-0500 (CDT) [info] - {"msg":"GET / 200", "ip":"127.0.0.1", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:37.0) Gecko/20100101 Firefox/37.0"}
*/

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

[npm-image]: https://img.shields.io/npm/v/logtastic.svg
[npm-url]: https://npmjs.org/package/logtastic
[downloads-image]: https://img.shields.io/npm/dm/logtastic.svg
[downloads-url]: https://npmjs.org/package/logtastic
