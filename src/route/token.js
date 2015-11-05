'use strict';

const router = require('express').Router(),
	logger = require('./../logger').tag('TOKEN');

var db;

router.get('/', (req, res, next) => {
	db.newToken((err, token) => {
		if (err) {
			res.statusCode = 500;
			next(new Error('Db Error'));
		} else {
			logger.debug('New token created', token);
			res.json({token: token});
		}
	});
});

module.exports = (_db) => {
	db = _db; // passed ready db
	return router;
};
