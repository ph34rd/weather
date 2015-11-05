'use strict';

const request = require('request'),
	http = require('http'),
	qs = require('querystring'),
	_ = require('lodash'),
	format = require('./../formatHelper');

const API_HOST = 'query.yahooapis.com';
const DEFAULT_TIMEOUT = 5000;
const USER_AGENT = 'Mozilla/4.0 (compatible; weatherApi)';

function Api(options) {
	options = options || {};

	this._apiHost = _.isString(options.apiHost) ? options.apiHost : API_HOST;
	this._userAgent = _.isString(options.userAgent) ? options._userAgent : USER_AGENT;
	this._timeout = _.isFinite(options.timeout) ? +options.timeout : DEFAULT_TIMEOUT;
	this._agent = ((options.agent === false) || (options.agent instanceof http.Agent)) ? options.agent : undefined;
}

Api.prototype.query = function(qstr, cb) {
	qstr = _.isString(qstr) ? format.normalizeSlug(qstr) : '';

	request({
		method: 'GET',
		url: 'https://' + this._apiHost +
			'/v1/public/yql?q=select%20item.condition%2Catmosphere%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22' +
			qs.escape(qstr) + '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys',
		timeout: this._timeout,
		agent: this._agent,
		headers: {
			'User-Agent': this._userAgent,
			'Accept': 'application/json'
		}
	}, function(err, res, body) {
		if (err) {
			cb(err);
			return;
		}

		if (res.statusCode === 200) { // some results
			var answer = {};
			try {
				var data = JSON.parse(body);
				if (!_.isPlainObject(data.query)) {
					throw new Error('Wrong JSON: query');
				}

				if (data.query.results === null) { // not found
					cb(null, answer);
					return;
				}

				if (!_.isPlainObject(data.query.results)) { // check results
					throw new Error('Wrong JSON: query.results');
				}

				if (!_.isPlainObject(data.query.results.channel)) { // check channel
					throw new Error('Wrong JSON: query.results.channel');
				}

				var qres = data.query.results.channel;

				if (_.isPlainObject(qres.item) && _.isPlainObject(qres.item.condition) && _.isString(qres.item.condition.temp)) {
					answer.temperature = format.normalizeTemp(+qres.item.condition.temp, 'F');
				}

				if (_.isPlainObject(qres.atmosphere)) {
					if (_.isString(qres.atmosphere.pressure)) {
						answer.pressure = format.normalizePresure(+qres.atmosphere.pressure, true);
					}
					if (_.isString(qres.atmosphere.humidity)) {
						answer.humidity = format.normalizeHumidity(+qres.atmosphere.humidity);
					}
				}

			} catch (e) {
				cb(e);
				return;
			}

			cb(null, answer);
		} else {
			cb(new Error('Api status code:' + res.statusCode));
		}
	});
};

module.exports = Api;
