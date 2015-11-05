'use strict';

const DEFAULT_CONFIG = './conf/default.json',
	ERR_FATAL = 1,
	ERR_DATAERR = 65;

var logger,
	shutdownExport,
	shutdownCalled;

function createExitFunc(code) {
	return () => {
		process.exit(+code);
	};
}

// setup signal handler
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(function(sig) {
	process.on(sig, () => {
		if (typeof shutdownExport === 'function') {
			shutdownCalled = true;
			shutdownExport(createExitFunc());
		}
	});
});

process.on('uncaughtException', (err) => { // handle error
	if (logger && logger.error) {
		logger.error(err.stack.split('\n    at ').filter((v) => v !== ''));
	} else {
		console.log(err.stack);
	}

	if (shutdownCalled) { // exception in shutdown, just exit
		process.exit(ERR_FATAL);
	}

	if (typeof shutdownExport === 'function') { // gracefull shutdown if module loaded
		shutdownCalled = true;
		shutdownExport(createExitFunc(ERR_FATAL));
	} else {
		process.exit(ERR_FATAL);
	}
});

// run app
logger = require('./logger').tag('BOOTSTRAP');

const argv = require('minimist')(process.argv, {
		string: ['c', 'l'],
		alias: {c: 'conf', l: 'level'},
		default: {c: DEFAULT_CONFIG, l: logger.LEVELS.INFO}
	});

const config = require('./config');

logger.setLevel(argv.level); // set log level
config.loadFromFile(argv.conf);

if (config.getErrors()) { // check log errors
	process.exit(ERR_DATAERR); // report load conf file errors
}

const worker = require('./worker'); // load app only after config loaded

shutdownExport = worker.shutdown;

worker.run(() => { // run single worker app
	if (typeof shutdownExport === 'function') {
		shutdownCalled = true;
		shutdownExport(createExitFunc(ERR_DATAERR)); // run shutdown on app load error
	}
});
