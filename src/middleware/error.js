'use strict';

const logger = require('./../logger').tag('HTTP_ERROR');

function sendRes(res, message) {
	if (res.errorAsJson) {
		res.json({message: message});
	} else {
		res.end(message);
	}
}

// error handler for all
module.exports = (err, req, res, next) => {
	if (res.statusCode === 405) { // Method Not Allowed
		sendRes(res, 'Method Not Allowed');
	} else if (res.statusCode === 403) { // Forbidden
		sendRes(res, 'Forbidden');
	} else if (res.statusCode === 400) { // Bad request
		sendRes(res, 'Bad request');
	} else if (res.statusCode === 404) { // Not found
		sendRes(res, 'Not Found');
	} else if (res.statusCode === 429) { // Too Many Request
		sendRes(res, 'Too Many Request');
	} else { // App error
		res.statusCode = 500;
		sendRes(res, 'Internal Server Error');

		logger.error('Http middleware error', err.stack.split('\n    at ').filter((v) => v !== ''));
	}

	next = null;
};
