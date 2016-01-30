var BaseLogger = require('./base');
var addLevels = require('./add-levels');
var util = require('util');

var Logtastic = module.exports = function Logtastic (options = {}) {
	// Call the parent constructor
	BaseLogger.call(this, {
		level: options.level,
		streams: options.streams,
		formatter: options.formatter,
		bufferFlushSize: options.bufferFlushSize,
		bufferFlushInterval: options.bufferFlushInterval
	});
};
util.inherits(Logtastic, BaseLogger);

// Transfer level constants
addLevels(Logtastic);

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
