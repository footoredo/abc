'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        sass: {
            dist: {
                options: {
                    outputStyle: 'compressed' // nested or compressed
                    // sourceMap: true,
                    // imagePath: '',
                    // includePaths: []
                    // more info: https://github.com/sindresorhus/grunt-sass
                },
                files: {
                    'assets/css/style.css': 'assets/scss/style.scss'
                }
            }
        },

        concat: {
            options: {
                separator: ';',
                stripBanners: true
            },
            dist: {
                src: [
                    "assets/js/danmu.js",
                    "assets/js/player.js"
                ],
                dest: "assets/js/danmuplayer.js"
            }
        },

        uglify: {
            options: {
            },
            dist: {
                files: {
                    "assets/js/danmuplayer.min.js": "assets/js/danmuplayer.js"
                }
            }
        },

        cssmin: {
            options: {
                keepSpecialComments: 0 
            },
            compress: {
                files: {
                    'assets/css/danmuplayer.min.css': [
                        "assets/css/danmu.css",
                        "assets/css/player.css"
                    ]
                }
            }
        },

        watch: {
            sass: {
                files: 'assets/scss/**/*.scss',
                tasks: ['sass']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.registerTask('default', ['sass', 'concat', 'uglify', 'cssmin', 'watch']);

};
