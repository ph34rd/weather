'use strict';

const logger = require('./logger').tag('DB'),
	levelup = require('level'),
	sublevel = require('level-sublevel'),
	async = require('async'),
	_ = require('lodash'),
	format = require('./formatHelper');

function Db(config) {
	config = config || {};
	this._path = config.path;
	this._handle = null;
}

Db.prototype.init = function(ready) {
	const options = {
		keyEncoding: 'utf8',
		valueEncoding: 'json'
	};

	levelup(this._path, options, (err, db) => {
		if (err) {
			logger.error('Db init error', err);
			ready(err);
		} else {
			logger.info('Db inited', this._path);
			this._handle = sublevel(db);
			// populate db namespaces
			this.cities = this._handle.sublevel('cities');
			this.citiesIndex = this._handle.sublevel('citiesIndex');
			this.weather = this._handle.sublevel('weather');
			this.tokens = this._handle.sublevel('tokens');
			ready(null, this._handle);
		}
	});
};

Db.prototype.close = function(ready) {
	if (this._handle) {
		this._handle.close((err) => {
			this._handle = null;
			if (err) {
				logger.error('Db close error', err);
				ready(err);
			} else {
				logger.info('Db saved', this._path);
				ready();
			}
		});
	} else {
		// queue cb
		setImmediate(ready);
	}
};

Db.prototype._handleDbError = function(err, cb) { // leveldb not found error helper
	if (err.notFound) {
		cb();
	} else {
		logger.error('Db error', err);
		cb(err);
	}
};

Db.prototype.tokenExists = function(token, cb) {
	this.tokens.get(token, (err, val) => {
		if (err) {
			this._handleDbError(err, cb);
		} else {
			if (val) {
				cb(null, token);
			} else {
				cb(null);
			}
		}
	});
};

Db.prototype.newToken = function(cb) {
	var token = format.newId();

	this.tokens.put(token, true, (err) => {
		if (err) {
			this._handleDbError(err, cb);
		} else {
			cb(null, token);
		}
	});
};

Db.prototype.getCityById = function(id, cb) {
	this.cities.get(id, (err, val) => {
		if (err) {
			this._handleDbError(err, cb);
		} else {
			cb(null, _.merge({id: id}, val));
		}
	});
};

Db.prototype.getCityBySlug = function(slug, done) {
	var id;

	async.series([
		(cb) => { // lookup slug index
			this.lookupCitySlugIndex(slug, (err, val) => {
				if (err) {
					cb(err);
				} else { // id found in index
					id = val;
					cb();
				}
			});
		},
		(cb) => { // fetch data by index
			if (!id) { // index not found
				cb();
				return;
			}

			this.getCityById(id, (err, val) => {
				if (err) {
					cb(err);
				} else {
					cb(null, val);
				}
			});
		}
	], (err, res) => {
		if (err) {
			done(err);
		} else {
			done(null, res[1]);
		}
	});
};

Db.prototype.lookupCitySlugIndex = function(slug, cb) {
	this.citiesIndex.get(slug, {valueEncoding: 'utf8'}, (err, val) => {
		if (err) {
			this._handleDbError(err, cb);
		} else {
			cb(null, val);
		}
	});
};

Db.prototype.putCity = function(slug, done) {
	var id;

	async.series([
		(cb) => { // lookup slug index
			this.lookupCitySlugIndex(slug, (err, val) => {
				if (err) {
					cb(err);
				} else { // id found in index
					id = val;
					cb();
				}
			});
		},
		(cb) => {
			if (id) { // index exists, just update
				// we dont need update, since slugs are static
				cb(null, {id: id, slug: slug});
				// this.cities.put(id, {slug: slug}, (err) => {
				// 	if (err) {
				// 		cb(err);
				// 	} else {
				// 		cb(null, {id: id, slug: slug});
				// 	}
				// });
			} else { // batch create index
				id = format.newId();

				this.cities.batch([
					{key: id, value: {slug: slug}, type: 'put'},
					{key: slug, value: id, type: 'put', valueEncoding: 'utf8', prefix: this.citiesIndex}
				], (err) => {
					if (err) {
						this._handleDbError(err, cb);
					} else {
						cb(null, {id: id, slug: slug});
					}
				});
			}
		}
	], (err, res) => {
		if (err) {
			done(err);
		} else {
			done(null, res[1]);
		}
	});
};

Db.prototype.putWeather = function(id, date, data, cb) {
	this.weather.put(id + format.formatDate(date), data, (err) => {
		if (err) {
			this._handleDbError(err, cb);
		} else {
			cb(null, data);
		}
	});
};

Db.prototype.getWeatherById = function(id, date, cb) {
	this.weather.get(id + format.formatDate(date), (err, val) => {
		if (err) {
			this._handleDbError(err, cb);
		} else {
			cb(null, _.merge({id: id}, val)); // append id
		}
	});
};

Db.prototype.getWeatherBySlug = function(slug, date, done) {
	var id;

	async.series([
		(cb) => { // lookup slug index
			this.lookupCitySlugIndex(slug, (err, val) => {
				if (err) {
					cb(err);
				} else { // id found in index
					id = val;
					cb();
				}
			});
		},
		(cb) => { // fetch data by index
			if (!id) { // index not found
				cb();
				return;
			}

			this.getWeatherById(id, date, (err, val) => {
				if (err) {
					cb(err);
				} else {
					cb(null, val);
				}
			});
		}
	], (err, res) => {
		if (err) {
			done(err);
		} else {
			done(null, res[1]);
		}
	});
};

Object.defineProperty(Db.prototype, 'client', {
	get: function() {
		if (this._handle) {
			return this._handle;
		} else {
			throw Error('Db not oppened');
		}
	}
});

module.exports = Db;
