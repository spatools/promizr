"use strict";

module.exports = function (grunt) {
    // Load grunt tasks automatically
    require("jit-grunt")(grunt, {
        nugetpack: "grunt-nuget",
        nugetpush: "grunt-nuget",
        buildcontrol: "grunt-build-control"
    });
    require("time-grunt")(grunt); // Time how long tasks take. Can help when optimizing build times
    
    var 
        pkg = require("./package.json"),
        paths = {
            src: "src",
            polyfill: "polyfill",
            build: "build",
            dist: "dist",
            lib: "lib",
            temp: ".temp",
            test: "tests",
            testpzr: "tests/promizr",
            testpoly: "tests/testpoly"
        },
        options = {
            dev: grunt.option("dev")
        };
    
    // Define the configuration for all the tasks
    grunt.initConfig({
        // Configurable paths
        paths: paths,
        pkg: pkg,
        
        ts: {
            options: {
                target: "es3",
                module: "amd",
                sourceMap: false,
                declaration: false,
                comments: true
            },
            src: {
                src: ["<%= paths.src %>/**/*.ts", "!<%= paths.src %>/**/*.d.ts"],
                options: {
                    declaration: true,
                    module: "commonjs",
                }
            },
            polyfill: {
                src: ["<%= paths.polyfill %>/**/*.ts", "!<%= paths.polyfill %>/**/*.d.ts"],
                options: {
                    sourceMap: true,
                    comments: false
                }
            },
            testpzr: {
                src: ["<%= paths.testpzr %>/**/*.ts", "!<%= paths.testpzr %>/**/*.d.ts"],
                options: {
                    sourceMap: true,
                    comments: false
                }
            },
            testpoly: {
                src: ["<%= paths.testpoly %>/**/*.ts", "!<%= paths.testpoly %>/**/*.d.ts"],
                options: {
                    sourceMap: true,
                    comments: false
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
                    replacer: function (content) { return content.replace(new RegExp("(export )?declare", "g"), "export"); }
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
            },
            publish: {
                files: [{
                    expand: true,
                    src: ["README.md", "LICENSE"],
                    dest: "<%= paths.dist %>/"
                }]
            }
        },
        
        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            all: {
                src: [
                    "<%= tslint.src.src %>", 
                    "<%= tslint.polyfill.src %>", 
                    "<%= tslint.testpzr.src %>", 
                    "<%= tslint.testpoly.src %>"
                ]
            },
            src: {
                src: "<%= paths.src %>/**/*.ts"
            },
            polyfill: {
                src: "<%= paths.polyfill %>/**/*.ts"
            },
            testpzr: {
                src: "<%= paths.testpzr %>/**/*.ts"
            },
            testpoly: {
                src: "<%= paths.testpoly %>/**/*.ts"
            }
        },
        
        mocha: {
            options: {
                log: true,
                run: false
            },
            testpzr: ["<%= paths.testpzr %>/index.html"],
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
            test: [
                "<%= clean.src %>",
                "<%= clean.polyfill %>",
                "<%= clean.testpzr %>",
                "<%= clean.testpoly %>",
            ],
            testpzr: [
                "<%= clean.src %>",
                "<%= paths.testpzr %>/**/*.{d.ts,js,js.map}",
                "!<%= paths.testpzr %>/tests.d.ts"
            ],
            testpoly: [
                "<%= clean.polyfill %>",
                "<%= paths.testpoly %>/**/*.{d.ts,js,js.map}",
                "!<%= paths.testpoly %>/tests.d.ts"
            ]
        },
        
        connect: {
            options: {
                port: "8080",
                livereload: 23432
            },
            test: {
                options: {
                    open: "http://localhost:8080/<%= paths.test %>/",
                }
            },
            testpzr: {
                options: {
                    open: "http://localhost:8080/<%= paths.testpzr %>/index.html",
                }
            },
            testpoly: {
                options: {
                    open: "http://localhost:8080/<%= paths.testpoly %>/index.html",
                }
            }
        },
        
        watch: {
            tslint: { files: ["<%= tslint.all.src %>"], tasks: ["tslint:src"] },
            promizr: { files: ["<%= ts.src.src %>"], tasks: ["ts:src", "concat:dist", "wrapper:dist"] },
            polyfill: { files: ["<%= ts.polyfill.src %>"], tasks: ["ts:polyfill"] },
            testpoly: { files: ["<%= ts.testpoly.src %>"], tasks: ["ts:testpoly"] },
            testpzr: { files: ["<%= ts.testpzr.src %>"], tasks: ["ts:testpzr"] },
            gruntfile: { files: ["Gruntfile.js"] },
            
            livereload: {
                options: {
                    livereload: "<%= connect.options.livereload %>"
                },
                files: [
                    "<%= paths.dist %>/**/*.js",
                    "<%= paths.polyfill %>/**/*.{js,js.map}",
                    "<%= paths.test %>/**/*.{js,html}"
                ]
            }
        },
        
        buildcontrol: {
            options: {
                dir: "<%= paths.dist %>",
                commit: true,
                push: true,
                branch: "release",
                message: "Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%"
            },
            dist: {
            },
            publish: {
                options: {
                    tag: pkg.version,
                    message: "Publish %sourceName% '" + pkg.version + "' from commit %sourceCommit% on branch %sourceBranch%"
                }
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
    
    grunt.registerTask("fixpkgs", "Fix package.json", function () {
        fixPkg("package.json");
        fixPkg("bower.json");
        
        function fixPkg(file) {
            var fileJSON = grunt.file.readJSON(file);
                
            delete fileJSON.scripts;
            delete fileJSON.devDependencies;
            
            grunt.file.write(paths.dist + "/" + file, JSON.stringify(fileJSON, null, 2));
            grunt.log.ok(paths.dist + "/" + file + " created!");
        }
    });
    
    grunt.registerTask("dev-promizr", ["tslint:src", "ts:dev"]);
    grunt.registerTask("dev-polyfill", ["tslint:polyfill", "ts:polyfill"]);
    grunt.registerTask("dev-testpzr", ["tslint:testpzr", "ts:testpzr"]);
    grunt.registerTask("dev-testpoly", ["tslint:testpoly", "ts:testpoly"]);
    
    grunt.registerTask("polyfill", ["tslint:polyfill", "browserify:polyfill", "wrapper:polyfill", "uglify:polyfill", "copy:polyfill", "clean:polyfill"]);
    grunt.registerTask("promizr", ["tslint:src", "ts:src", "concat:dist", "wrapper:dist", "uglify:dist", "concat:decla", "wrapper:decla", "clean:src"]);
    grunt.registerTask("build", ["polyfill", "promizr"]);
    
    grunt.registerTask("test-promizr", ["build", "dev-testpzr", "mocha:testpzr", "clean:testpzr"]);
    grunt.registerTask("test-polyfill", ["dev-polyfill", "dev-testpoly", "mocha:testpoly", "clean:testpoly"]);
    grunt.registerTask("test", ["dev-polyfill", "build", "dev-testpoly", "dev-testpzr", "mocha", "clean:test"]);
    
    grunt.registerTask("btest-promizr", ["build", "dev-testpzr", "connect:testpzr", "watch"]);
    grunt.registerTask("btest-polyfill", ["dev-polyfill", "dev-testpoly", "connect:testpoly", "watch"]);
    grunt.registerTask("btest", ["build", "dev-polyfill", "dev-testpoly", "dev-testpzr", "connect:test", "watch"]);
    
    grunt.registerTask("nuget", ["nugetpack", "nugetpush"]);
    grunt.registerTask("prepublish", ["build", "copy:publish", "buildcontrol:dist"]);
    grunt.registerTask("publish", ["build", "copy:publish", "fixpkgs", "buildcontrol:publish", "nuget"]);
    
    grunt.registerTask("default", ["clean:test", "polyfill", "test"]);
};