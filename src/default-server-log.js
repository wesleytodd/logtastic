var xhr = require('xhr');

module.exports = function (url) {
	return function (msgs, done) {
		xhr({
			method: 'POST',
			url: url,
			json: {
				messages: msgs
			}
		}, function (err, resp, body) {
			if (err) {
				return done(err);
			}
			if (resp.statusCode >= 400) {
				return done(new Error('Failed to send log to server: got status ' + resp.statusCode));
			}
			done();
		});
	};
};
