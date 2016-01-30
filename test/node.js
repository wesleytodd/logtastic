/* global describe, it */
var assert = require('assert');
var Logger = require('../lib/node');
var writer = function (cb) {
	return {write: function (msg, encoding, done) {
		cb(msg);
	}};
};

describe('Logger', function () {
	it('logUncaught should add a listener to process', function () {
		var logger = new Logger();
		var off = logger.logUncaught();
		assert(process._events.uncaughtException);
		assert.equal(typeof off, 'function');
	});

	it('should return a middleware for logging requests', function (done) {
		var w = writer(function (msg) {
			assert(msg.indexOf('127.0.0.1 http: GET') !== -1);
			done();
		});
		var logger = new Logger({
			level: Logger.INFO,
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
			method: 'GET',
			get: function () {}
		}, {});
	});
});
