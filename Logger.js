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
	options.parseArgv = typeof options.parseArgv !== 'undefined' ? options.parseArgv : Logtastic.defaultOptions.parseArgv;

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
			options.cli = false;
		}
	}

	// If cli, specify the cli colored formatter
	if (options.cli) {
		options.formatter = cliFormatter;
	}

	// Call the parent constructor
	Loggerr.call(this, {
		level: options.level,
		streams: options.streams,
		formatter: options.formatter
	});

	// Setup the properties of the logger
	this.logToFile = options.logToFile || !options.cli || Logtastic.defaultOptions.logToFile;
	this.outfile = options.outfile || Logtastic.defaultOptions.outfile;
	this.errfile = options.errfile || Logtastic.defaultOptions.errfile;

	// This flag will be set to true when the
	// file streams are opened for the first time
	this._fileStreamsOpen = false;
};
util.inherits(Logtastic, Loggerr);

// Transfer level constants
Logtastic.levels = Loggerr.levels;
Logtastic.levels.forEach(function(level, i) {
	Logtastic[level.toUpperCase()] = i;
});
Logtastic.SILENT = -1;

/**
 * The default options
 *
 */
Logtastic.defaultOptions = {
	cli: !!process.stdout.isTTY,
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
 * Override log so we can open our filestreams
 *
 */
Logtastic.prototype.log = function(level, msg, extra, done) {
	if (this.logToFile && !this._fileStreamsOpen) {
		this._openFileStreams();
	}
	return Loggerr.prototype.log.call(this, level, msg, extra, done);
};

/**
 * Initalize the streams
 *
 */
Logtastic.prototype._openFileStreams = function() {
	// Only open the files once
	if (this._fileStreamsOpen) {
		return;
	}

	this._fileStreamsOpen = true;
	var stdout = fs.createWriteStream(this.outfile, {flags: 'a'});
	var stderr = fs.createWriteStream(this.errfile, {flags: 'a'});
	this.streams = Logtastic.levels.map(function(l, i) {
		return i > Logtastic.WARNING ? stdout : stderr;
	});
};

/**
 * Start logging uncaught exceptions
 *
 */
Logtastic.prototype.logUncaught = function(level) {
	// Do we have that level?
	var logFnc = this[Logtastic.levels[level || Logtastic.EMERGENCY]];
	if (!logFnc) {
		return;
	}

	// Bind fnc to this and add listener
	logFnc = logFnc.bind(this);
	process.on('uncaughtException', logFnc);

	// Return an off function
	return function() {
		process.removeListener('uncaughtException', logFnc);
	};
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

		this[Logtastic.levels[options.level]](msg);
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
