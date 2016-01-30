var BaseLogger = require('./base');
var addLevels = require('./add-levels');
var util = require('util');
var onFinished = require('on-finished');
var minimist = require('minimist');

var Logtastic = module.exports = function Logtastic (options = {}) {
	// Call the parent constructor
	BaseLogger.call(this, {
		level: options.level,
		streams: options.streams,
		formatter: options.formatter,
		bufferFlushSize: options.bufferFlushSize,
		bufferFlushInterval: options.bufferFlushInterval
	});

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
			f: 'logToFile',
			l: 'logLevel',
			v: 'verbose',
			s: 'silent'
		}
	};
};
util.inherits(Logtastic, BaseLogger);

// Transfer level constants
addLevels(Logtastic);

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
		var msg = [
			req.ip,
			req.protocol,
			req.method,
			req.originalUrl,
			res.statusCode,
			req.get('referrer'),
			req.get('user-agent')
		].filter(function (val) {
			return typeof val !== 'undefined';
		}).join(' ');

		this[Logtastic.levels[options.level]](msg);
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
