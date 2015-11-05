'use strict';

const logger = require('./logger').tag('API'),
	http = require('http'),
	https = require('https'),
	Openweathermap = require('./weatherApi/openweathermap'),
	Yahoo = require('./weatherApi/yahoo'),
	format = require('./formatHelper'),
	async = require('async');

function ApiWrapper(config) {
	config = config || {};
	config.openweathermap = config.openweathermap || {};
	config.yahoo = config.yahoo || {};

	// init apis
	this._apis = [];

	this._apis.push(new Openweathermap({
		timeout: config.openweathermap.timeout,
		apiKey: config.openweathermap.apiKey,
		agent: new http.Agent({
			keepAlive: config.openweathermap.keepAlive,
			keepAliveMsecs: config.openweathermap.keepAliveMsecs
		})
	}));

	this._apis.push(new Yahoo({
		timeout: config.yahoo.timeout,
		agent: new https.Agent({
			keepAlive: config.yahoo.keepAlive,
			keepAliveMsecs: config.yahoo.keepAliveMsecs
		})
	}));
}

ApiWrapper.prototype.query = function(slug, done) {
	var currentApi = 0,
		result = {},
		lastError;

	async.whilst(() => { // interupt if query fullfilled or no more apis
		return !format.isWeatherFulfilled(result) && this._apis[currentApi];
	}, (cb) => {
		this._apis[currentApi].query(slug, (err, data) => {
			if (err) {
				logger.error('Api error', currentApi, err, data);
				lastError = err;
			} else {
				logger.debug('Api result', currentApi, err, data);
			}
			result = format.weatherFulfill(result, data); // merge result data
			currentApi++;
			cb();
		});
	}, (err) => {
		if (err) {
			done(err);
		} else if (format.isWeatherFulfilled(result)) {
			done(null, result);
		} else {
			done(lastError); // pass last api error if not found
		}
	});
};

module.exports = ApiWrapper;
