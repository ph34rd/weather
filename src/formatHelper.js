'use strict';

const _ = require('lodash'),
	moment = require('moment'),
	uuid = require('node-uuid');

module.exports = {

	normalizeSlug: function(str) {
		return (_.isString(str) ? str.replace(/\s\!/g, '').toLowerCase().slice(0, 128) : '');
	},

	normalizeTemp: function(val, degree) {
		if (degree === 'K') { // convert Kelvins
			return Math.round(val - 273.15);
		}
		if (degree === 'F') { // convert Fahrenheit
			return Math.round((val - 32) * 5 / 9);
		} else { // already Celsius
			return Math.round(val);
		}
	},

	normalizePresure: function(val, inhg) {
		if (inhg) { // convert inHG
			return Math.round(val * 33.8638866667);
		} else { // already hPa
			return Math.round(val);
		}
	},

	normalizeHumidity: function(val) {
		return Math.round(val);
	},

	isWeatherFulfilled: function(obj) {
		return (_.isPlainObject(obj) && _.isFinite(obj.humidity) && _.isFinite(obj.pressure) && _.isFinite(obj.temperature));
	},

	weatherFulfill: function(obj, obj2) {
		if (_.isPlainObject(obj))  {
			return _.merge(obj, obj2);
		} else if (_.isPlainObject(obj2)) {
			return obj2;
		} else {
			return {};
		}
	},

	newId: function() {
		return uuid.v1();
	},

	matchId: function(str) {
		return str.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
	},

	formatDate: function(date) {
		return moment(date).format('YYYYMMDD');
	},

	isYearValid: function(year) {
		var curYear = new Date().getUTCFullYear();
		return (_.isString(year) && year.match(/[0-9]{4}/) && year <= curYear && year > curYear - 2);
	},

	isMonthValid: function(month) {
		return (_.isString(month) && month.match(/[01][0-9]/) && month <= 12 && month > 0);
	},

	prepareInputDate: function(year, month, day) {
		if (_.isString(day) && day.match(/[0-3][0-9]/)) {
			var inputDate = moment([+year, month - 1, +day]);
			if (inputDate.isValid() && inputDate <= moment()) {
				return inputDate;
			}
		}
		return false;
	}

};
