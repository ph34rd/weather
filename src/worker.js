'use strict';

const config = require('./config').get(), // get all config
	logger = require('./logger').tag('WORKER'),
	express = require('express'),
	http = require('http'),
	async = require('async'),
	enableDestroy = require('server-destroy'),
	weather = require('./route/weather'),
	token = require('./route/token'),
	error = require('./middleware/error'),
	accepts = require('./middleware/accepts'),
	notFound = require('./middleware/notFound'),
	tokenAuth = require('./middleware/tokenAuth'),
	rateLimit = require('./middleware/rateLimit'),
	accessLog = require('./middleware/accessLog'),
	DbHelper = require('./dbHelper'),
	ApiWrapper = require('./apiWrapper'),
	Updater = require('./updater');

var apis, db, app, server, updater, state;

function run(exitFunc) {
	state = {}; // set initial service state

	// config apis
	apis = new ApiWrapper(config.api);
	// config db
	db = new DbHelper(config.db);
	// config updater
	updater = new Updater(db, apis, config.updater.conqurency);

	// config app
	app = express();
	app.disable('x-powered-by');
	app.set('trust proxy', config.http.trustProxy);
	app.use(accessLog);
	app.use(accepts);
	app.use(tokenAuth(db));
	app.use(rateLimit(config.limiter));
	app.use('/token', token(db));
	app.use('/weather', weather(db, apis));
	app.use(notFound);
	app.use(error); // error handler for all

	// setup http server
	server = http.createServer(app)
	.on('error', (err) => {
		logger.error('Http server', err);
	})
	.on('listening', () => {
		logger.info('Http server started', config.http.bind, config.http.port);
	})
	.setTimeout(config.http.connTimeout, (conn) => {
		logger.debug('Http connection closed by timeout', conn.remoteAddress, conn.remotePort);
		conn.destroy();
	});

	enableDestroy(server);

	// run app
	async.series([
		(cb) => { // init db
			db.init((err) => {
				if (err) {
					cb(err);
				} else {
					state.db = true;
					cb();
				}
			});
		},
		(cb) => { // start http server
			server.listen(config.http.port, config.http.bind, () => { // server started ok
				state.http = true;
				cb();
			}).once('error', (err) => { // server failed to start
				cb(err);
			});
		},
		(cb) => { // init updater schedule
			if (config.updater.schedule) {
				updater.schedule(config.updater.schedule);
			}
			setImmediate(cb);
		}
	], (err) => {
		if (err) {
			exitFunc(); // clean up after unsuccesfull run
		} else {
			logger.info('Service start successed');
		}
	});
}

function shutdown(exitFunc) {
	if (!state || state.stopping) { // ignore if not started or already stopping
		return;
	}

	state.stopping = true;

	logger.info('Cleaning up...');

	async.series([
		(cb) => { // stop updater
			if (!updater) {
				setImmediate(cb);
				return;
			}

			updater.stop(() => {
				cb();
			});
		},
		(cb) => { // stop http server
			if (!server || !state.http) {
				setImmediate(cb);
				return;
			}

			logger.info('Closing http server...');

			var graceTimeout = setTimeout(() => {
				logger.info('Http server destoyed');
				server.destroy();
			}, config.http.graceTimeout);

			server.close(() => {
				clearTimeout(graceTimeout);
				logger.info('Http server closed');
				state.http = false;
				cb();
			});
		},
		(cb) => { // save db
			if (!db || !state.db) {
				setImmediate(cb);
				return;
			}

			db.close(cb);
		}
	], () => {
		logger.info('Service stopped');
		exitFunc();
	});
}

module.exports = {
	run: run,
	shutdown: shutdown
};
