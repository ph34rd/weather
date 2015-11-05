'use strict';

const logger = require('./../logger').tag('ACCESS'),
	util = require('util'),
	onFinished = require('finished'),
	shortId = require('shortid');

function getip(req) {
	return req.ip ||
			req._remoteAddress ||
			(req.connection && req.connection.remoteAddress) ||
			'noip';
}

module.exports = (req, res, next) => {
	req._loggerStart = process.hrtime();
	req.rid = shortId.generate(); // assign uniq id to request

	onFinished(res, function() {
		var diff = process.hrtime(req._loggerStart);
		var ms = diff[0] * 1e3 + diff[1] * 1e-6;
		ms = ms.toFixed(3);

		// log request
		logger.info(util.format('rid:%s %s %s %d (%d)ms ip(%s) agent: %s ref: %s',
			req.rid, req.method, req.originalUrl || req.url, (res._header) ? res.statusCode : 0, ms, getip(req), req.headers['user-agent'] || '', req.headers.referrer || ''));
	});

	next();
};
