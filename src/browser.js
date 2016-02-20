var Loggerr = require('loggerr');
var addLevels = require('./add-levels');
var util = require('util');
var xhr = require('xhr');

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
	this.serverLog = (function () {
		// Default log to a url with a POST request
		if (typeof options.serverLog === 'string') {
			return function (msg, done) {
				xhr({
					method: 'POST',
					url: options.serverLog,
					json: {
						message: msg
					}
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
		}

		// Provide a custom logging method
		if (typeof options.serverLog === 'function') {
			return options.serverLog;
		}

		// Server logging turned off, noop
		return function (msg, done) {
			done();
		};
	})();
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
	this.buffer.push(msg);

	// If we have reached our max size, flush
	if (this.buffer.length >= this.bufferFlushSize) {
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
	if (!this.buffer.length) {
		return;
	}

	// Clear buffer first
	var _logs = this.buffer;
	this.buffer = [];

	this.serverLog(_logs, function (err) {
		if (err) {
			// Re-add logs to buffer and retry on error
			this.buffer = _logs.concat(this.buffer);
			this.scheduleFlush();
		}
	}.bind(this));
};

Logtastic.prototype.scheduleFlush = function () {
	this._flushTimeout = setTimeout(() => {
		this.flushServerLogs();
	}, this.bufferFlushInterval);
};
