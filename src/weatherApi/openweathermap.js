'use strict';

const request = require('request'),
	http = require('http'),
	qs = require('querystring'),
	_ = require('lodash'),
	format = require('./../formatHelper');

const API_HOST = 'api.openweathermap.org';
const DEFAULT_TIMEOUT = 5000;
const USER_AGENT = 'Mozilla/4.0 (compatible; weatherApi)';

function Api(options) {
	options = options || {};

	this._apiHost = _.isString(options.apiHost) ? options.apiHost : API_HOST;
	this._apiKey = _.isString(options.apiKey) ? qs.escape(options.apiKey) : '';
	this._userAgent = _.isString(options.userAgent) ? options._userAgent : USER_AGENT;
	this._timeout = _.isFinite(options.timeout) ? +options.timeout : DEFAULT_TIMEOUT;
	this._agent = ((options.agent === false) || (options.agent instanceof http.Agent)) ? options.agent : undefined;
}

Api.prototype.query = function(qstr, cb) {
	qstr = _.isString(qstr) ? format.normalizeSlug(qstr) : '';

	request({
		method: 'GET',
		url: 'http://' + this._apiHost + '/data/2.5/weather?q=' + qs.escape(qstr) + '&appid=' + this._apiKey,
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

		if (res.statusCode === 200) { // found
			var answer = {};
			try {
				var data = JSON.parse(body);
				if (!_.isString(data.cod) && !_.isFinite(data.cod)) {
					throw new Error('Wrong JSON: cod');
				}

				data.cod = +data.cod; // convert cod to number (shitty api... varies string or number)
				if (data.cod === 200) {
					if (!_.isPlainObject(data.main)) {
						throw new Error('Wrong JSON: main');
					}

					if (_.isFinite(data.main.temp)) { // temp found
						answer.temperature = format.normalizeTemp(data.main.temp, 'K');
					}

					if (_.isFinite(data.main.humidity)) { // humidity found
						answer.humidity = format.normalizeHumidity(data.main.humidity);
					}

					if (_.isFinite(data.main.pressure)) { // pressure found
						answer.pressure = format.normalizePresure(data.main.pressure);
					}
				} else if (data.cod !== 404) { // if not not found
					throw new Error('Api status code:' + data.cod);
				}
			} catch (e) {
				cb(e);
				return;
			}

			cb(null, answer);
		} else if (res.statusCode === 404) { // city not found
			cb(null, {});
		} else {
			cb(new Error('Api status code:' + res.statusCode));
		}
	});
};

module.exports = Api;
