'use strict';

module.exports = (req, res, next) => {
	res.statusCode = 404; // pass not found
	next(new Error('Route not resolved'));
};
