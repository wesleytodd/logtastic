var minimist = require('minimist');
var fs = require('fs');
var Logtastic = require('./Logger');

var options = {};

// Parse argv
var argv = minimist(process.argv, {
	string: [
		'logLevel'
	],
	boolean: [
		'logToFile',
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
});

// Set log level
if (argv.silent) {
	options.level = Logtastic.SILENT;
} else if (argv.debug) {
	options.level = Logtastic.DEBUG;
} else if (argv.verbose) {
	options.level = Logtastic.INFO;
} else if (argv.logLevel) {
	var i = Logtastic.levels.indexOf(argv.logLevel);
	if (i !== -1) {
		options.level = i;
	}
}

// If cli, specify the cli colored formatter
if (!argv.logToFile && !!process.stdout.isTTY) {
	options.formatter = require('loggerr/formatters/cli');
}

// Export an instance of logger
// with the default options
var log = module.exports = new Logtastic(options);

// If logging to file add open streams method
if (argv.logToFile) {
	log._openFileStreams = function () {
		// Only open the files once
		if (log._fileStreamsOpen) {
			return;
		}

		log._fileStreamsOpen = true;
		var stdout = fs.createWriteStream(log.outfile, {flags: 'a'});
		var stderr = fs.createWriteStream(log.errfile, {flags: 'a'});
		log.streams = Logtastic.levels.map(function (l, i) {
			return i > Logtastic.WARNING ? stdout : stderr;
		});
	};
}

// Export the constructor function
log.Logtastic = Logtastic;

// Export the levels
log.levels = Logtastic.levels;
Logtastic.levels.forEach(function (level, i) {
	log[level.toUpperCase()] = i;
});
log.SILENT = -1;
