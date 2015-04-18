var Loggerr = require('loggerr'),
	cliFormatter = require('loggerr/formatters/cli'),
	minimist = require('minimist'),
	util = require('util'),
	onFinished = require('on-finished'),
	fs = require('fs');

var Logtastic = module.exports = function(options) {
	// Setup default options
	options = options || {};
	options.cli = options.cli || Logtastic.defaultOptions.cli;
	options.outfile = options.outfile || Logtastic.defaultOptions.outfile;
	options.errfile = options.errfile || Logtastic.defaultOptions.errfile;
	options.parseArgv = typeof options.parseArgv !== 'undefined' ? options.parseArgv : Logtastic.defaultOptions.parseArgv;
	options.logToFile = options.logToFile || Logtastic.defaultOptions.logToFile;
	options.logUncaught = typeof options.logUncaught !== 'undefined' ? options.logUncaught : Logtastic.defaultOptions.logUncaught;

	// Parse argv
	if (options.parseArgv) {
		// Parse the args
		var argv = minimist(process.argv, options.parseArgv);

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

		// Force log to file
		if (argv.logToFile) {
			options.logToFile = true;
		}
	}

	// Setup file streams
	if ((options.logToFile && !options.streams) || (!options.cli && !options.streams)) {
		var stdout = fs.createWriteStream(options.outfile, {flags: 'a'});
		var stderr = fs.createWriteStream(options.errfile, {flags: 'a'});
		options.streams = Logtastic.levels.map(function(l, i) {
			return i > Logtastic.WARNING ? stdout : stderr;
		})
	}

	// If cli, specify the cli colored formatter
	if (options.cli) {
		options.formatter = cliFormatter;
	}

	// Catch uncaught exceptions?
	if (options.logUncaught) {
		process.on('uncaughtException', function(err) {
			this[Logtastic.levels[options.logUncaught]](err);
		}.bind(this));
	}

	Loggerr.call(this, {
		level: options.level,
		streams: options.streams,
		formatter: options.formatter
	});
};
util.inherits(Logtastic, Loggerr);

// Transfer level constants
Logtastic.levels = Loggerr.levels;
Logtastic.levels.forEach(function(level, i) {
	Logtastic[level.toUpperCase()] = i;
});
Logtastic.SILENT = -1;

Logtastic.defaultOptions = {
	cli: !!process.stdout.isTTY,
	logUncaught: Logtastic.emergency,
	logToFile: false,
	outfile: 'stdout.log',
	errfile: 'stderr.log',
	parseArgv: {
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
	},
	middleware: {
		level: Logtastic.INFO,
		immediate: false
	}
};

/**
 * An express style middleware function for logging requests
 *
 */
Logtastic.prototype.middleware = function(options) {
	options = options || {};
	options.immediate = options.immediate || Logtastic.defaultOptions.middleware.immediate;
	options.level = options.level || Logtastic.defaultOptions.middleware.level;

	var doLog = function(req, res) {
		var msg = [
			req.ip,
			req.protocol,
			req.method,
			req.originalUrl,
			res.statusCode,
			req.get('referrer'),
			req.get('user-agent')
		].filter(function(val) {
			return typeof val !== 'undefined';
		}).join(' ');

		this[options.level](msg);
	}.bind(this);

	return function(req, res, next) {
		if (options.immediate) {
			doLog(req, res);
		} else {
			onFinished(res, function() {
				doLog(req, res);
			});
		}
		next();
	};
};
