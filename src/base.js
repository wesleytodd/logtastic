var Loggerr = require('loggerr');
var util = require('util');
var addLevels = require('./add-levels');

var LogtasticBaseLogger = module.exports = function LogtasticBaseLogger (options = {}) {
	// Call the parent constructor
	Loggerr.call(this, {
		level: options.level,
		streams: options.streams,
		formatter: options.formatter
	});

	// Buffer and flush logs?
	this.bufferFlushSize = options.bufferFlushSize || 0;
	this.bufferFlushInterval = options.bufferFlushInterval || 0;
};
util.inherits(LogtasticBaseLogger, Loggerr);

// Transfer level constants
addLevels(LogtasticBaseLogger);
