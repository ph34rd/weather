'use strict';

const util = require('util'),
	os = require('os'),
	moment = require('moment');

const LEVELS = {
	'DEBUG': 0,
	'INFO': 1,
	'WARN': 2,
	'ERROR': 3
};
const DEFAULT_LEVEL = LEVELS.INFO;
const DEFAULT_TAG = 'MAIN';

function createLogger(level, name) {
	return function() {
		var ilvl = +level;
		if (Logger._level <= ilvl) {
			console.log('[%s][%s][HOST:%s][PID:%d][TAG:%s] %s', moment().utc().format('YYYY-MM-DD HH:mm:ss'), name, this._hostname, process.pid, this._tag, util.format.apply(util, arguments));
		}
	};
}

function Logger(tag) {
	this._tag = tag || DEFAULT_TAG;
	this._hostname = os.hostname();
}

Logger._level = DEFAULT_LEVEL;

Logger.prototype = {
	debug: createLogger(LEVELS.DEBUG, 'DEBUG'),
	info: createLogger(LEVELS.INFO, 'INFO'),
	warn: createLogger(LEVELS.WARN, 'WARN'),
	error: createLogger(LEVELS.ERROR, 'ERROR'),

	setLevel: function(level) {
		Logger._level = +level;
		return this;
	},

	tag: function(tag) {
		return new Logger(tag);
	},
};

Object.defineProperty(Logger.prototype, 'LEVELS', {
	get: function() {
		return LEVELS;
	}
});

var inst = new Logger();
module.exports = inst;
