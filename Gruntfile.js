"use strict";

module.exports = function (grunt) {
    // Load grunt tasks automatically
    require("jit-grunt")(grunt, {
        nugetpack: "grunt-nuget",
        nugetpush: "grunt-nuget"
    }); 
    require("time-grunt")(grunt); // Time how long tasks take. Can help when optimizing build times

    var options = {
        dev: grunt.option("dev")
    };

    // Define the configuration for all the tasks
    grunt.initConfig({
        // Configurable paths
        paths: {
            src: "src",
            polyfill: "polyfill",
            build: "dist",
            lib: "lib",
            temp: ".temp",
            test: "tests"
        },
        pkg: grunt.file.readJSON("package.json"),

        typescript: {
            options: {
                target: "es3",
                module: "amd",
                sourceMap: false,
                declaration: false,
                comments: false,
                disallowbool: true,
                disallowimportmodule: true
            },
            dev: {
                src: "<%= paths.src %>/**/*.ts",
                options: {
                    sourceMap: true
                }
            },
            test: {
                src: "<%= paths.test %>/**/*.ts"
            },
            dist: {
                src: "<%= paths.src %>/**/*.ts",
                dest: "<%= paths.build %>/",
                options: {
                    basePath: "<%= paths.src %>"
                }
            },
            node: {
                src: "<%= paths.src %>/**/*.ts",
                dest: "<%= paths.lib %>/",
                options: {
                    target: "es5",
                    module: "commonjs",
                    basePath: "<%= paths.src %>"
                }
            }
        },

        browserify: {
            options: {
                browserifyOptions: {
                    detectGlobals: false
                },
                preBundleCB: function (b) {
                    b.plugin("tsify", {
                        target: "ES3",
                        sourceMap: false,
                        declaration: false,
                        removeComments: true
                    });
                }
            },
            polyfill: {
                files: {
                    "dist/polyfill.js": ["<%= paths.polyfill %>/class.ts"]
                }
            }
        },

        jshint: {
            options: {
                jshintrc: "jshint.json",
            },

            base: ["*.js"],
            dev: ["<%= paths.src %>/**/*.js"],
            polyfill: ["<%= paths.polyfill %>/**/*.js"],
            dist: ["<%= paths.build %>/**/*.js", "!<%= paths.build %>/**/*.min.js"],
            test: {
                options: {
                    "-W030": true,
                    "-W068": true
                },
                src: "<%= paths.test %>/**/*.js"
            }
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            polyfill: {
                src: "<%= paths.polyfill %>/**/*.ts"
            },
            test: {
                src: "<%= paths.test %>/**/*.ts"
            }
        },

        connect: {
            test: {
                options: {
                    port: "8080",
                    open: "http://localhost:8080/tests/index.html",
                    keepalive: true
                }
            }
        },

        mocha: {
            test: ["<%= paths.test %>/index.html"]
        },

        clean: {
            nuget: "nuget/*.nupkg",
            dev: [
                "<%= paths.src %>/**/*.d.ts",
                "!<%= paths.src %>/promise.d.ts",
                "<%= paths.src %>/**/*.js",
                "<%= paths.src %>/**/*.js.map"
            ],
            test: [
                "<%= paths.test %>/**/*.d.ts",
                "!<%= paths.test %>/tests.d.ts",
                "<%= paths.test %>/**/*.js",
                "<%= paths.test %>/**/*.js.map"
            ],
        },

        nugetpack: {
            all: {
                src: "nuget/*.nuspec",
                dest: "nuget/",

                options: {
                    version: "<%= pkg.version %>"
                }
            }
        },
        nugetpush: {
            all: {
                src: "nuget/*.<%= pkg.version %>.nupkg"
            }
        },

        watch: {
            tslint: {
                files: ["<%= tslint.dev.src %>"],
                tasks: ["tslint:dev"]
            },
            jshint: {
                files: ["<%= jshint.dev.src %>"],
                tasks: ["jshint:dev"]
            },
            test: {
                files: ["<%= paths.test %>/*.*"],
                tasks: ["test"]
            },
            gruntfile: {
                files: ["Gruntfile.js"]
            }
        }
    });
    
    grunt.registerTask("create-polyfill", function () {

    });

    grunt.registerTask("dev", ["tslint:app", "typescript:dev", "jshint:dev"]);

    grunt.registerTask("polyfill", ["tslint:polyfill", "browserify:polyfill", "jshint:polyfill"]);
    grunt.registerTask("build", ["tslint:app", "typescript:dist", "jshint:dist", "requirejs", "typescript:node", "jshint:node"]);
    
    grunt.registerTask("test", ["dev", "tslint:test", "typescript:test", "jshint:test", "mocha:test"]);
    grunt.registerTask("nuget", ["nugetpack", "nugetpush"]);

    grunt.registerTask("default", ["clean", "build", "test"]);
};