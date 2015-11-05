'use strict';

const logger = require('./logger').tag('UPDATE'),
	async = require('async'),
	schedule = require('node-schedule'),
	format = require('./formatHelper');

function Updater(_db, _apis, concurrency) {
	this.db = _db;
	this.apis = _apis;

	// init queue
	this._initQueue(concurrency);
}

Updater.prototype._initQueue = function(concurrency) {
	this.q = async.queue((task, cb) => {
		this._updateOne(task.id, task.slug, task.date, cb);
	}, concurrency);

	this.q.empty = () => {
		logger.debug('Queue empty');
		this.stream.resume();
	};

	this.q.saturated = () => {
		logger.debug('Queue saturated');
		this.stream.pause();
	};
};

Updater.prototype._updateOne = function(id, slug, date, done) {
	logger.debug('Updating slug', id, slug);

	this.apis.query(slug, (err, data) => {
		if (!err && format.isWeatherFulfilled(data)) {
			this.db.putWeather(id, date, data, (err) => {
				if (err) {
					done();
				} else {
					logger.debug('Updated slug', id, slug, data);
					done();
				}
			});
		} else {
			done();
		}
	});
};

Updater.prototype.stop = function(done) {
	if (!this.stopping) {
		this.stopping = true;

		if (this.schedTask) { //cancel scheduled task
			logger.debug('Scheduled task canceled');
			this.schedTask.cancel();
		}

		if (this.q && this.q.running()) {
			logger.debug('Killing queue');
			this.q.kill(); // kill queue

			this.q.drain = () => { // wait for current running tasks to complete
				logger.debug('Queue drained');
				done();
			};
		} else {
			setImmediate(done);
		}
	} // ignore subsequent stops

	return this;
};

Updater.prototype.update = function(done) {
	if (this.stopping || this.q.running()) { // call immediate done on stopping or already running
		setImmediate(done);
		return this;
	}

	var today = new Date();

	function drain() {
		logger.debug('Queue drained');
		done();
	}

	logger.debug('New update started');

	this.stream = this.db.cities.createReadStream()
	.on('data', (data) => {
		if (!this.stopping && data && data.key && data.value && data.value.slug) {
			this.q.push({id: data.key, slug: data.value.slug, date: today});
		}
	})
	.on('error', (err) => {
		logger.error('Db error', err);
	})
	.on('end', () => {
		logger.debug('Db stream end');

		if (this.q.running() === 0 && this.q.length() === 0) {
			drain();
		} else {
			this.q.drain = drain;
		}
	});

	return this;
};

Updater.prototype.schedule = function(date) {
	if (this.stopping) {
		return this;
	}

	if (this.schedTask) {
		this.schedTask.cancel();
		logger.debug('Update rescheduled on', date);
	} else {
		logger.debug('Update scheduled on', date);
	}

	this.schedTask = schedule.scheduleJob(date, () => {
		logger.debug('Starting scheduled update...');
		this.update(() => {});
	});

	return this;
};

module.exports = Updater;
