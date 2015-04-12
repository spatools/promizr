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
            src: {
                src: "<%= paths.src %>/**/*.ts",
                options: {
                    module: "commonjs",
                }
            },
            polyfill: {
                src: "<%= paths.polyfill %>/**/*.ts",
                options: {
                    sourceMap: true,
                    removeComments: false
                }
            },
            test: {
                src: "<%= paths.test %>/**/*.ts",
                options: {
                    sourceMap: true,
                    removeComments: false
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
                    "<%= paths.build %>/polyfill.js": ["<%= paths.polyfill %>/polyfill.ts"]
                }
            }
        },

        concat: {
            dist: {
                src: ["<%= paths.src %>/*.js", "!**/*.tmpl.js"],
                dest: "<%= paths.build %>/promizr.js"
            }
        },
        
        wrapper: {
            dist: {
                src: "<%= paths.build %>/promizr.js",
                options: {
                    template: "<%= paths.src %>/umd.tmpl.js"
                }
            },
            polyfill: {
                src: "<%= paths.build %>/polyfill.js",
                options: {
                    template: "<%= paths.polyfill %>/umd.tmpl.js",
                    derequire: true
                }
            }
        },

        copy: {
            polyfill: {
                src: "<%= paths.polyfill %>/promise.d.ts",
                dest: "<%= paths.build %>/promise.d.ts"
            }
        },

        jshint: {
            options: {
                jshintrc: "jshint.json",
            },

            base: ["*.js"],
            src: ["<%= paths.src %>/**/*.js"],
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
            src: {
                src: "<%= paths.src %>/**/*.ts"
            },
            polyfill: {
                src: "<%= paths.polyfill %>/**/*.ts"
            },
            test: {
                src: "<%= paths.test %>/**/*.ts"
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

        connect: {
            test: {
                options: {
                    port: "8080",
                    open: "http://localhost:8080/tests/index.html",
                    keepalive: true
                }
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
        }
    });
    
    grunt.registerTask("append-polyfill", function () {
        var content = grunt.file.read("dist/polyfill.js"),
            umd = grunt.file.read("polyfill/umd.tmpl.js");

        umd = umd.replace("/*****************************CONTENT*****************************/", content);
        umd = require("derequire")(umd, "_import", "require");

        grunt.file.write("dist/polyfill.js", umd);
    });
    

    grunt.registerMultiTask("wrapper", function () {
        var options = this.options({
            token: "/*****************************CONTENT*****************************/",
            derequire: false
        });

        if (!options.template) {
            grunt.log.error().error("A template option must be provided");
            return;
        }

        this.files.forEach(function (f) {
            f.src.forEach(function (src) {
                var content = grunt.file.read(src),
                    tmpl = grunt.file.read(options.template);

                tmpl = tmpl.replace(options.token, content);
                if (options.derequire) {
                    tmpl = require("derequire")(tmpl, "_import", "require");
                }

                grunt.file.write(src, tmpl);
                grunt.log.ok("File '" + src + "' wrapped using template '" + options.template + "'");
            });
        });
        
    });

    grunt.registerTask("dev", ["tslint:app", "typescript:dev"]);
    grunt.registerTask("dev-polyfill", ["tslint:polyfill", "typescript:polyfill"]);

    grunt.registerTask("polyfill", ["tslint:polyfill", "browserify:polyfill", "wrapper:polyfill", "copy:polyfill"]);
    grunt.registerTask("promizr", ["tslint:src", "typescript:src", "concat:dist", "wrapper:dist"]);
    grunt.registerTask("build", ["polyfill", "promizr"]);
    
    grunt.registerTask("test-polyfill", ["dev-polyfill", "tslint:test", "typescript:test", "jshint:test", "mocha:test", "clean:polyfill", "clean:test"]);
    grunt.registerTask("btest-polyfill", ["dev-polyfill", "tslint:test", "typescript:test", "jshint:test", "connect:test"]);

    grunt.registerTask("nuget", ["nugetpack", "nugetpush"]);

    grunt.registerTask("default", ["clean", "build", "test"]);
};