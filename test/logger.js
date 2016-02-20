/* global describe, it */
var Logger = require('../').Logtastic;
var defaultFormatter = require('loggerr/formatters/default');
var assert = require('assert');
var writer = function (cb) {
	return {write: function (msg, encoding, done) {
		cb(msg);
	}};
};

describe('Logger', function () {
	it('should not log on silent level', function (done) {
		var w = writer(function (chunk) {
			throw new Error('Should not log on silent');
		});
		var logger = new Logger({
			streams: Logger.levels.map(function () {
				return w;
			}),
			level: Logger.SILENT
		});
		Logger.levels.forEach(function (level, i) {
			logger[level]('foo');
		});
		done();
	});

	it('logUncaught should add a listener to process', function () {
		var logger = new Logger();
		var off = logger.logUncaught();
		assert(process._events.uncaughtException);
		assert.equal(typeof off, 'function');
	});

	it('should log global extra params', function (done) {
		var w = writer(function (msg) {
			assert(msg.indexOf('"foo":"bar"') !== -1);
			done();
		});
		var logger = new Logger({
			extra: {
				foo: 'bar'
			},
			// Make sure we use the default formatter for this one
			formatter: defaultFormatter,
			streams: Logger.levels.map(function () {
				return w;
			})
		});
		logger.error('Something');
	});

	it('should return a middleware for logging requests', function (done) {
		var w = writer(function (msg) {
			assert(msg.indexOf('GET /foobar 200') !== -1);
			assert(msg.indexOf('"ip":"127.0.0.1"') !== -1);
			done();
		});
		var logger = new Logger({
			level: Logger.INFO,
			// Make sure we use the default formatter for this one
			formatter: defaultFormatter,
			streams: Logger.levels.map(function () {
				return w;
			})
		});
		var m = logger.middleware({
			immediate: true
		});
		assert.equal(typeof m, 'function');
		m({
			ip: '127.0.0.1',
			protocol: 'http:',
			url: '/foobar',
			method: 'GET',
			get: function () {}
		}, {
			statusCode: 200
		});
	});
});
