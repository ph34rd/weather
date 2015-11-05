'use strict';

const logger = require('./logger').tag('CONFIG'),
	_ = require('lodash'),
	util = require('util'),
	fs = require('fs'),
	path = require('path'),
	inspector = require('schema-inspector'),
	schema = require('./configSchema'),
	jsonStrip = require('strip-json-comments');

function Config() {
	this._errors = [];
	this._config = {};
}

Config.prototype._toJson = function(data) {
	var result;

	try {
		result = JSON.parse(jsonStrip(data.toString()));
	} catch (err) {
		this._errors.push('JSON parse error');
		logger.error('JSON parse error');
		result = {}; // null object
	}

	return result;
};

Config.prototype.loadFromFile = function(filename, skipValidator) {
	var filepath = path.resolve(filename);
	var data;

	try {
		data = fs.readFileSync(filepath);
	} catch (err) {
		this._errors.push('Failed to load config', filepath);
		logger.error('Failed to load config', filepath);
		this._config = {}; // null config
		return;
	}

	this._config = this._toJson(data);

	if (!skipValidator && this._errors.length === 0) {
		this._validate();
	}
};

Config.prototype._validate = function() {
	// sanitize first
	this._config = inspector.sanitize(schema, this._config).data;
	var result = inspector.validate(schema, this._config);

	if (!result.valid) {
		result.format().split('\n').forEach((err) => {
			this._errors.push(err);
			logger.error(err);
		});
	}
};

Config.prototype.getErrors = function() {
	return (this._errors.length === 0) ? null : this._errors;
};

Config.prototype.get = function(objPath) {
	if (objPath) {
		if (!_.isString(objPath)) {
			logger.error('get wrong objPath');
			return;
		}

		var obj = this._config;
		for (var i = 0, p = objPath.split('.'), len = p.length; i < len; i++) {
			if (_.has(obj, p[i])) {
				obj = obj[p[i]];
			} else {
				logger.debug('get no property', objPath);
				return;
			}
		}
		logger.debug('get', objPath, util.inspect(obj, {depth: null}));
		return obj;
	} else {
		logger.debug('get-all', util.inspect(this._config, {depth: null}));
		return this._config;
	}
};

var inst = new Config();
module.exports = inst;
