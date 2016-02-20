var Loggerr = require('loggerr');
var addLevels = require('./add-levels');
var util = require('util');
var onFinished = require('on-finished');
var minimist = require('minimist');
var parseurl = require('parseurl');
var cliFormatter;

var Logtastic = module.exports = function Logtastic (options = {}) {
	// Set formatter to cli if we are in a tty and dont have a formatter specified
	if (!options.formatter && !!process.stdout.isTTY) {
		options.formatter = cliFormatter = cliFormatter || require('loggerr/formatters/cli');
	}

	// Call the parent constructor
	Loggerr.call(this, {
		level: options.level,
		streams: options.streams,
		formatter: options.formatter
	});

	// Logger global extras
	this.extra = options.extra || {};

	// Parse args?
	this.minimistOpts = options.minimistOpts || {
		string: [
			'logLevel'
		],
		boolean: [
			'debug',
			'verbose',
			'silent'
		],
		alias: {
			l: 'logLevel',
			v: 'verbose',
			s: 'silent'
		}
	};
};
util.inherits(Logtastic, Loggerr);

// Transfer level constants
addLevels(Logtastic);

// Overwrite log to merge in logger extras
Logtastic.prototype.log = require('./log-merge-extras')(Loggerr.prototype.log);

/**
 * Parse cli args
 */
Logtastic.prototype.parseArgs = function () {
	// Parse the args
	var argv = minimist(process.argv, this.minimistOpts);

	// Set log level
	if (argv.silent) {
		this.level = Logtastic.SILENT;
	} else if (argv.debug) {
		this.level = Logtastic.DEBUG;
	} else if (argv.verbose) {
		this.level = Logtastic.INFO;
	} else if (argv.logLevel) {
		var i = Logtastic.levels.indexOf(argv.logLevel);
		if (i !== -1) {
			this.level = i;
		}
	}
};

/**
 * Start logging uncaught exceptions
 */
Logtastic.prototype.logUncaught = function (level) {
	// Do we have that level?
	var logFnc = this[Logtastic.levels[level || Logtastic.EMERGENCY]];
	if (!logFnc) {
		return;
	}

	// Bind fnc to this and add listener
	logFnc = logFnc.bind(this);
	process.on('uncaughtException', logFnc);

	// Return an off function
	return function () {
		process.removeListener('uncaughtException', logFnc);
	};
};

/**
 * An express style middleware function for logging requests
 */
Logtastic.prototype.middleware = function (options) {
	options = options || {};
	options.immediate = options.immediate || false;
	options.level = options.level || Logtastic.INFO;

	var doLog = function (req, res) {
		// Get the url from the request
		var url = parseurl(req);

		var msg = [
			req.method,
			url.format(),
			res.statusCode
		].filter(function (val) {
			return typeof val !== 'undefined';
		}).join(' ');

		var extra = {
			ip: req.ip,
			referrer: req.get('referrer'),
			userAgent: req.get('user-agent')
		};

		this[Logtastic.levels[options.level]](msg, extra);
	}.bind(this);

	return function (req, res, next) {
		if (options.immediate) {
			doLog(req, res);
		} else {
			onFinished(res, function () {
				doLog(req, res);
			});
		}
		typeof next === 'function' && next();
	};
};
