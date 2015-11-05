'use strict';

const RateLimiter = require('limiter').RateLimiter,
	logger = require('./../logger').tag('RATE_LIMIT');

const DEFAUL_TOKENS = 150;
const DEFAUL_INTERVAL = 'hour';

module.exports = (config) => {
	config = config || {};
	var tokens = config.tokens || DEFAUL_TOKENS,
		interval = config.interval || DEFAUL_INTERVAL,
		rateMap = new Map(); // in memory db :)

	return (req, res, next) => {
		if (!req.token) { // no limitation if token missing
			next();
			return;
		}

		var limiter;

		if (rateMap.has(req.token)) {
			limiter = rateMap.get(req.token);
		} else {
			logger.debug('New limiter for token', req.token);
			limiter = new RateLimiter(tokens, interval, true);
			rateMap.set(req.token, limiter);
		}

		limiter.removeTokens(1, (err, remainingRequests) => {
			if (err) {
				res.statusCode = 500;
				next(new Error('Limiter Error'));
			} else {
				if (remainingRequests < 0) {
					logger.debug('Limiter blocked token, remaining', req.token, remainingRequests);
					res.statusCode = 429;
					next(new Error('Too Many Request'));
				} else {
					logger.debug('Limiter passed token, remaining', req.token, remainingRequests);
					next();
				}
			}
		});
	};
};
