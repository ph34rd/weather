'use strict';

const router = require('express').Router(),
	logger = require('./../logger').tag('WEATHER'),
	_ = require('lodash'),
	async = require('async'),
	format = require('./../formatHelper');

var	db, apis;

function resNotOk(res, next, code, message) {
	res.statusCode = code;
	next(new Error(message));
}

router.param('city', (req, res, next, city) => { // check & prepare city param
	req.city = format.normalizeSlug(city);
	if (req.city.length === 0) {
		resNotOk(res, next, 404, 'Bad city id');
		return;
	}

	next();
});

router.param('year', (req, res, next, year) => { // check & prepare year param
	if (!format.isYearValid(year)) {
		resNotOk(res, next, 404, 'Bad year');
		return;
	}

	next();
});

router.param('month', (req, res, next, month) => { // check & prepare month param
	if (!format.isMonthValid(month)) {
		resNotOk(res, next, 404, 'Bad month');
		return;
	}

	next();
});

router.param('day', (req, res, next, day) => { // check & prepare day param & validate date
	req.date = format.prepareInputDate(req.params.year, req.params.month, day);
	if (!req.date) {
		resNotOk(res, next, 404, 'Bad date');
		return;
	}

	next();
});

router.get('/:city', (req, res, next) => {
	var city = req.city,
		result = {},
		slug,
		fetchMethod;

	logger.debug('Input city', city);

	if (format.matchId(city)) { // id input detected
		logger.debug('Fetching by id', city);
		fetchMethod = db.getCityById.bind(db);
	} else {
		logger.debug('Fetching by slug', city);
		fetchMethod = db.getCityBySlug.bind(db);
		slug = city;
	}

	async.series([
		(cb) => { // fetch index
			fetchMethod(city, (err, val) => {
				if (err) {
					cb(err);
				} else {
					if (val) { // slug found
						result.id = val.id; // also considered as found flag
						slug = val.slug;
					}
					cb();
				}
			});
		},
		(cb) => { // query apis
			if (slug) {
				logger.debug('Query for api', slug);
				apis.query(slug, function(err, data) {
					result = format.weatherFulfill(result, data);
					cb();
				});
			} else {
				logger.debug('Slug not found');
				cb();
			}
		},
		(cb) => { // store new slug if needed
			if (slug && format.isWeatherFulfilled(result) && !result.id) { // if id missing in index, put new city
				db.putCity(slug, function(err, data) {
					if (err) {
						cb(err);
					} else {
						result = _.merge({id: data.id}, result); // append new id to answer
						cb();
					}
				});
			} else {
				cb();
			}
		}
	], (err) => {
		if (err) {
			resNotOk(res, next, 500, 'Db Error');
		} else {
			if (slug && format.isWeatherFulfilled(result)) {
				res.json(result);
			} else {
				resNotOk(res, next, 404, 'Slug not found');
			}
		}
	});
});

router.get('/:city/:year/:month/:day', (req, res, next) => {
	var city = req.city,
		date = req.date,
		fetchMethod;

	logger.debug('Input city, date', city, format.formatDate(date));

	if (format.matchId(city)) { // id input detected
		logger.debug('Fetching by id', city);
		fetchMethod = db.getWeatherById.bind(db);
	} else {
		logger.debug('Fetching by slug', city);
		fetchMethod = db.getWeatherBySlug.bind(db);
	}

	fetchMethod(city, date, (err, result) => {
		if (err) {
			resNotOk(res, next, 500, 'Db Error');
		} else {
			if (result) {
				res.json(result);
			} else {
				resNotOk(res, next, 404, 'Slug not found');
			}
		}
	});
});

module.exports = (_db, _apis) => {
	db = _db; // passed ready db
	apis = _apis;
	return router;
};
