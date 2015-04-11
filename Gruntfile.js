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
                removeComments: true
            },
            dev: {
                src: "<%= paths.src %>/**/*.ts",
                options: {
                    sourceMap: true,
                    removeComments: true
                }
            },
            polyfill: {
                src: "<%= paths.polyfill %>/**/*.ts",
                options: {
                    sourceMap: true,
                    removeComments: true
                }
            },
            test: {
                src: "<%= paths.test %>/**/*.ts"
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
                options: {
                    //require: [["./polyfill/class.ts", { expose: "./test" }]]
                    //require: ["./polyfill/class.ts"]
                },
                files: {
                    "dist/polyfill.js": ["<%= paths.polyfill %>/polyfill.ts"]
                    //src: [],
                    //dest: "dist/polyfill.js"
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
            polyfill: [
                "<%= paths.polyfill %>/**/*.{d.ts,js,js.map}",
                "!<%= paths.polyfill %>/promise.d.ts",
                "!<%= paths.polyfill %>/*.tmpl.js"
            ],
            test: [
                "<%= paths.test %>/**/*.{d.ts,js,js.map}",
                "!<%= paths.test %>/tests.d.ts"
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
    
    grunt.registerTask("append-polyfill", function () {
        var content = grunt.file.read("dist/polyfill.js"),
            umd = grunt.file.read("polyfill/umd.tmpl.js");

        umd = umd.replace("/*****************************CONTENT*****************************/", content);
        umd = require("derequire")(umd, "_import", "require");

        grunt.file.write("dist/polyfill.js", umd);
    });

    grunt.registerTask("dev", ["tslint:app", "typescript:dev", "jshint:dev"]);
    grunt.registerTask("dev-polyfill", ["tslint:polyfill", "typescript:polyfill", "jshint:polyfill"]);

    grunt.registerTask("polyfill", ["tslint:polyfill", "browserify:polyfill", "append-polyfill"]);
    grunt.registerTask("build", ["tslint:app", "typescript:dist", "jshint:dist", "requirejs", "typescript:node", "jshint:node"]);
    
    grunt.registerTask("test-polyfill", ["dev-polyfill", "tslint:test", "typescript:test", "jshint:test", "mocha:test", "clean:polyfill", "clean:test"]);
    grunt.registerTask("btest-polyfill", ["dev-polyfill", "tslint:test", "typescript:test", "jshint:test", "connect:test"]);

    grunt.registerTask("nuget", ["nugetpack", "nugetpush"]);

    grunt.registerTask("default", ["clean", "build", "test"]);
};