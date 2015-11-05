'use strict';

const format = require('./../formatHelper'),
	logger = require('./../logger').tag('TOKEN_AUTH');

const HEADER_KEY = 'Bearer';
const MAKE_TOKEN_URI = '/token';

function resNotOk(res, next, code, message) {
	res.statusCode = code;
	next(new Error(message));
}

module.exports = (db) => {
	return (req, res, next) => {
		if (req.url === MAKE_TOKEN_URI) { // ignore token create url
			next();
			return;
		}

		var token;

		if (req.headers && req.headers.authorization) {
			let parts = req.headers.authorization.split(' ');

			if (parts.length === 2 && parts[0] === HEADER_KEY) {
				token = parts[1];
			}
		}

		if (!token || !format.matchId(token)) {
			logger.debug('Bad token passed');
			resNotOk(res, next, 403, HEADER_KEY + ' token required');
			return;
		}

		// check token in db
		db.tokenExists(token, (err, val) => {
			if (err) {
				resNotOk(res, next, 500, 'Db Error');
			} else {
				if (val) { // if token exists add to req
					logger.debug('Token authorized', val);
					req.token = val;
					next();
				} else {
					logger.debug('Token not found', token);
					resNotOk(res, next, 403, HEADER_KEY + ' token required');
				}
			}
		});
	};
};
