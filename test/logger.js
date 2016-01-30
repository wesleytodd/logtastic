/* global describe, it */
var Logger = require('../lib/base');
var writer = function (cb) {
	return {write: function (msg, encoding, done) {
		cb(msg);
	}};
};

describe('BaseLogger', function () {
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
});
