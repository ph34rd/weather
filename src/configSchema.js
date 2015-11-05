'use strict';

const path = require('path');

module.exports = {
	type: 'object',
	properties: {
		http: {
			type: 'object',
			properties: {
				bind: {
					type: 'string',
					pattern: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
					def: '127.0.0.1',
					optional: false
				},
				port: {
					type: 'number',
					min: 1,
					max: 65535,
					def: 8080,
					optional: false
				},
				connTimeout: {
					type: 'number',
					min: 0,
					def: 30000,
					optional: false
				},
				graceTimeout: {
					type: 'number',
					min: 0,
					def: 35000,
					optional: false
				},
				trustProxy: {
					type: 'boolean',
					def: false,
					optional: false
				}
			},
			def: {
				bind: '127.0.0.1',
				port: 8080,
				connTimeout: 30000,
				graceTimeout: 35000,
				trustProxy: false
			},
			optional: false
		},
		db: {
			type: 'object',
			properties: {
				path: {
					type: 'string',
					def: './db/weather.db',
					optional: false,
					exec: (schema, str) => path.resolve(str)
				}
			},
			def: {
				path: './db/weather.db',
			},
			optional: false
		},
		api: {
			type: 'object',
			properties: {
				openweathermap: {
					type: 'object',
					properties: {
						timeout: {
							type: 'number',
							min: 0,
							def: 5000,
							optional: false
						},
						apiKey: {
							type: 'string',
							exactLength: 32,
							optional: false
						},
						keepAlive: {
							type: 'boolean',
							def: true,
							optional: false
						},
						keepAliveMsecs: {
							type: 'number',
							min: 0,
							def: 3000,
							optional: false
						}
					},
					def: {
						timeout: 5000,
						keepAlive: true,
						keepAliveMsecs: 3000
					},
					optional: false
				},
				yahoo: {
					type: 'object',
					properties: {
						timeout: {
							type: 'number',
							min: 0,
							def: 5000,
							optional: false
						},
						keepAlive: {
							type: 'boolean',
							def: true,
							optional: false
						},
						keepAliveMsecs: {
							type: 'number',
							min: 0,
							def: 3000,
							optional: false
						}
					},
					def: {
						timeout: 5000,
						keepAlive: true,
						keepAliveMsecs: 3000
					},
					optional: false
				}
			},
			def: {
				openweathermap: {
					timeout: 5000,
					keepAlive: true,
					keepAliveMsecs: 3000
				},
				yahoo: {
					timeout: 5000,
					keepAlive: true,
					keepAliveMsecs: 3000
				}
			},
			optional: false
		},
		updater: {
			type: 'object',
			properties: {
				conqurency: {
					type: 'number',
					min: 1,
					def: 5,
					optional: false
				},
				schedule: {
					type: 'string',
					optional: true
				}
			},
			def: {
				conqurency: 5
			},
			optional: false
		},
		limiter: {
			type: 'object',
			properties: {
				tokens: {
					type: 'number',
					min: 0,
					def: 150,
					optional: false
				},
				interval: {
					type: 'number',
					min: 0,
					def: 3600000,
					optional: false
				}
			},
			def: {
				tokens: 150,
				interval: 3600000
			},
			optional: false
		}
	}
};
