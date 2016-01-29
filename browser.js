var Logtastic = require('./Logger');

// Export an instance of logger
// with the default options
var log = module.exports = new Logtastic({
	formatter: require('loggerr/formatters/browser')
});

// Export the constructor function
log.Logtastic = Logtastic;

// Export the levels
log.levels = Logtastic.levels;
Logtastic.levels.forEach(function (level, i) {
	log[level.toUpperCase()] = i;
});
log.SILENT = -1;

/**
 * Start logging uncaught exceptions
 */
log.logUncaught = function (level) {
	// Do we have that level?
	var logFnc = log[Logtastic.levels[level || Logtastic.EMERGENCY]];
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
