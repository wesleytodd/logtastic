var levels = require('loggerr').levels;

module.exports = function addLevels (Logtastic) {
	// Transfer level constants
	Logtastic.levels = levels;
	Logtastic.levels.forEach(function (level, i) {
		Logtastic[level.toUpperCase()] = i;
	});
	Logtastic.SILENT = -1;
};
