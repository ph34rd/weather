'use strict';

module.exports = (req, res, next) => {
	if (req.accepts('application/json')) {
		res.errorAsJson = true;
		next();
	} else {
		res.statusCode = 400; // pass bad request
		next(new Error('Json support on client required'));
	}
};
