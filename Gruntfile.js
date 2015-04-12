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
            build: "build",
            dist: "dist",
            lib: "lib",
            temp: ".temp",
            test: "tests",
            testpoly: "tests/testpoly"
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
                    declaration: true,
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
            testpoly: {
                src: "<%= paths.testpoly %>/**/*.ts",
                options: {
                    sourceMap: true,
                    removeComments: false
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
                    "<%= paths.dist %>/polyfill.js": ["<%= paths.polyfill %>/polyfill.ts"]
                }
            }
        },

        uglify: {
            dist: {
                src: "<%= paths.dist %>/promizr.js",
                dest: "<%= paths.dist %>/promizr.min.js"
            },
            polyfill: {
                src: "<%= paths.dist %>/polyfill.js",
                dest: "<%= paths.dist %>/polyfill.min.js"
            }
        },

        concat: {
            dist: {
                src: "<%= paths.src %>/*.js",
                dest: "<%= paths.dist %>/promizr.js"
            },
            decla: {
                src: "<%= paths.src %>/*.d.ts",
                dest: "<%= paths.dist %>/promizr.d.ts"
            }
        },
        
        wrapper: {
            dist: {
                src: "<%= paths.dist %>/promizr.js",
                options: {
                    template: "<%= paths.build %>/promizr.tmpl.js"
                }
            },
            decla: {
                src: "<%= paths.dist %>/promizr.d.ts",
                options: {
                    template: "<%= paths.build %>/decla.tmpl.d.ts",
                    replacer: function(content) { return content.replace(new RegExp("(export )?declare", "g"), "export"); }
                }
            },
            polyfill: {
                src: "<%= paths.dist %>/polyfill.js",
                options: {
                    template: "<%= paths.build %>/polyfill.tmpl.js",
                    derequire: true
                }
            }
        },

        copy: {
            polyfill: {
                src: "<%= paths.polyfill %>/promise.d.ts",
                dest: "<%= paths.dist %>/promise.d.ts"
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
            testpoly: {
                src: "<%= paths.testpoly %>/**/*.ts"
            }
        },

        mocha: {
            testpoly: ["<%= paths.testpoly %>/index.html"]
        },

        clean: {
            nuget: "nuget/*.nupkg",
            src: [
                "<%= paths.src %>/**/*.{d.ts,js,js.map}"
            ],
            polyfill: [
                "<%= paths.polyfill %>/**/*.{d.ts,js,js.map}",
                "!<%= paths.polyfill %>/promise.d.ts"
            ],
            testpoly: [
                "<%= paths.testpoly %>/**/*.{d.ts,js,js.map}",
                "!<%= paths.testpoly %>/tests.d.ts"
            ],
        },

        connect: {
            options: {
                port: "8080",
                keepalive: true
            },
            testpoly: {
                options: {
                    open: "http://localhost:8080/<%= paths.testpoly %>/index.html",
                }
            }
        },

        watch: {
            tslint: { files: ["<%= tslint.dev.src %>"], tasks: ["tslint:src"] },
            src: { files: ["<%= typescript.src.src %>"], tasks: ["typescript:src"] },
            polyfill: { files: ["<%= typescript.polyfill.src %>"], tasks: ["typescript:polyfill"] },
            testpoly: { files: ["<%= typescript.testpoly.src %>"], tasks: ["typescript:testpoly"] },
            gruntfile: { files: ["Gruntfile.js"] }
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

    grunt.registerMultiTask("wrapper", function () {
        var options = this.options({
            token: "/*****************************CONTENT*****************************/",
            replacer: false,
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

                if (options.derequire)
                    content = require("derequire")(content, "_import", "require");

                if (options.replacer) 
                    content = options.replacer(content);

                grunt.file.write(src, tmpl.replace(options.token, content));
                grunt.log.ok("File '" + src + "' wrapped using template '" + options.template + "'");
            });
        });

    });

    grunt.registerTask("dev-promizr", ["tslint:src", "typescript:dev"]);
    grunt.registerTask("dev-polyfill", ["tslint:polyfill", "typescript:polyfill"]);
    grunt.registerTask("dev-testpoly", ["tslint:testpoly", "typescript:testpoly"]);

    grunt.registerTask("polyfill", ["tslint:polyfill", "browserify:polyfill", "wrapper:polyfill", "uglify:polyfill", "copy:polyfill", "clean:polyfill"]);
    grunt.registerTask("promizr", ["tslint:src", "typescript:src", "concat:dist", "wrapper:dist", "uglify:dist", "concat:decla", "wrapper:decla", "clean:src"]);
    grunt.registerTask("build", ["polyfill", "promizr"]);

    grunt.registerTask("test-polyfill", ["dev-polyfill", "dev-testpoly", "mocha:testpoly", "clean:polyfill", "clean:testpoly"]);
    grunt.registerTask("btest-polyfill", ["dev-polyfill", "dev-testpoly", "connect:testpoly"]);

    grunt.registerTask("nuget", ["nugetpack", "nugetpush"]);

    grunt.registerTask("default", ["clean", "build", "test"]);
};