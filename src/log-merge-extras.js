var assign = require('object-assign');

module.exports = function (log) {
	return function (level, msg, extra, done) {
		// Extra is optional
		if (typeof extra === 'function') {
			done = extra;
			extra = {};
		}
		extra = assign({}, this.extra, extra || {});
		log.call(this, level, msg, extra, done);
	};
};