var Logtastic = require('./Logger');

// Export an instance of logger
// with the default options
var log = module.exports = new Logtastic();

// Export the constructor function
log.Logtastic = Logtastic;

// Export the levels
log.levels = Logtastic.levels;
Logtastic.levels.forEach(function(level, i) {
	log[level.toUpperCase()] = i;
});
log.SILENT = -1;
