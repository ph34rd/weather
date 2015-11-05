'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			options: {
				jshintrc: '.jshintrc.json'
			},
			all: ['*.js', 'src/**/*.js']
		},
		jscs: {
			options: {
				config: '.jscsrc.json'
			},
			src: ['*.js', 'src/**/*.js']
		},
		watch: {
			scripts: {
				files: ['*.js', 'src/**/*.js'],
				tasks: ['jshint', 'jscs'],
				options: {
					spawn: false
				}
			}
		},
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jscs');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['jshint', 'jscs']);
};
