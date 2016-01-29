var Loggerr = require('loggerr');
var util = require('util');
var onFinished = require('on-finished');

var Logtastic = module.exports = function (options) {
	// Setup default options
	options = options || {};

	// Call the parent constructor
	Loggerr.call(this, {
		level: options.level,
		streams: options.streams,
		formatter: options.formatter
	});

	// Setup the properties of the logger
	this.outfile = options.outfile || 'stdout.log';
	this.errfile = options.errfile || 'stderr.log';

	// This flag will be set to true when the
	// file streams are opened for the first time
	this._fileStreamsOpen = false;
};
util.inherits(Logtastic, Loggerr);

// Transfer level constants
Logtastic.levels = Loggerr.levels;
Logtastic.levels.forEach(function (level, i) {
	Logtastic[level.toUpperCase()] = i;
});
Logtastic.SILENT = -1;

/**
 * Override log so we can open our filestreams
 */
Logtastic.prototype.log = function (level, msg, extra, done) {
	if (this._openFileStreams && this._fileStreamsOpen) {
		this._fileStreamsOpen = true;
		this._openFileStreams();
	}
	return Loggerr.prototype.log.call(this, level, msg, extra, done);
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
		next();
	};
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
