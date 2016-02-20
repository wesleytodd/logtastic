var Loggerr = require('loggerr');
var addLevels = require('./add-levels');
var defaultServerLog = require('./default-server-log');
var util = require('util');

var Logtastic = module.exports = function Logtastic (options = {}) {
	// Call the parent constructor
	Loggerr.call(this, {
		level: options.level,
		streams: options.streams,
		formatter: options.formatter
	});

	// Logger global extras
	this.extra = options.extra || {};

	// Buffer server logs stuff
	this._buffer = [];
	this._flushTimeout = null;
	this.bufferFlushSize = options.bufferFlushSize || 0;
	this.bufferFlushInterval = options.bufferFlushInterval || 0;

	// A method to log to the server
	this.serverLog = options.serverLog || false;
};
util.inherits(Logtastic, Loggerr);

// Transfer level constants
addLevels(Logtastic);

// Overwrite log to merge in logger extras
Logtastic.prototype.log = require('./log-merge-extras')(Loggerr.prototype.log);

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
	var _oldError = window.onerror;
	window.onerror = function (msg, url, line, col, error) {
		logFnc(error || msg);
		typeof _oldError === 'function' && _oldError(msg, url, line, col, error);
	};

	// Return an off function
	return function () {
		window.onerror = _oldError;
	};
};

/**
 * Overwrite _write to also log to the server
 */
Logtastic.prototype._write = function (stream, msg, enc, done) {
	this.bufferServerLog(msg);
	Loggerr.prototype._write.call(this, stream, msg, enc, done);
};

Logtastic.prototype.bufferServerLog = function (msg) {
	// Add to the buffer
	this._buffer.push(msg);

	// If we have reached our max size, flush
	if (this._buffer.length >= this.bufferFlushSize) {
		return this.flushServerLogs();
	}

	// If we have a flush interval, set the timout
	if (this.bufferFlushInterval) {
		this.scheduleFlush();
	}
};

Logtastic.prototype.flushServerLogs = function () {
	// Always clear flush timeout
	clearTimeout(this._flushTimeout);

	// Only do anything if we have buffered items
	if (!this._buffer.length) {
		return;
	}

	// Clear buffer first
	var _logs = this._buffer;
	this._buffer = [];

	getServerLogger(this.serverLog)(_logs, function (err) {
		if (err) {
			// Re-add logs to buffer and retry on error
			this._buffer = _logs.concat(this._buffer);
			this.scheduleFlush();
		}
	}.bind(this));
};

Logtastic.prototype.scheduleFlush = function () {
	this._flushTimeout = setTimeout(() => {
		this.flushServerLogs();
	}, this.bufferFlushInterval);
};

function getServerLogger (opt) {
	// Default log to a url with a POST request
	if (typeof opt === 'string') {
		return defaultServerLog(opt);
	}

	// Provide a custom logging method
	if (typeof opt === 'function') {
		return opt;
	}

	// Server logging turned off, noop
	return function (msg, done) {
		done();
	};
}
