(function(){
    'use strict';

    var util = require('util');
    var path = require('path');
    var fs = require('fs');
    var yeoman = require('yeoman-generator');
    var chalk = require('chalk');
    var yosay = require('yosay');
    var mkdirp = require('mkdirp');
    var inquirer = require('inquirer');
    var _ = require('lodash');

    var pkg = require('./templates/_package.json');
    console.log(pkg);
    var devDependencies = pkg.devDependencies;
    var dependencies = pkg.dependencies;


    /**
     * Functions within callable from child object
     */
    var PrivateBase = yeoman.generators.Base.extend({

        /**
         * Install all packages in package.json, bower.json, etc.
         */
        installAll: function installAll(){
            console.log('entered installAll!');
            console.log("this.doInstallPkgs: " + this.doInstallPkgs);
            if (!!this.doInstallPkgs) {
                console.log('entered if !!this.doInstallPkgs!');
                this.installDependencies({
                    bower: true,
                    npm: true,
                    skipInstall: false,
                    callback: function pkgInstallDone() {
                        console.log('npm and Bower pkg installation complete!');
                    }
                });
            } else {
                console.log('no pkgs were installed - run npm install in' +
                            'project root to complete setup');
            }
        },

        /**
         * Install all packages in _package.json (template) one-by-one
         */
        installIntoExisting: function installIntoExisting(){
            console.log('entered installIntoExisting!');
            for (var key in devDependencies) {
                console.log("installIntoExisting: pkg name: " + key + ";; version: " + devDependencies[key]);
                if (devDependencies.hasOwnProperty(key)){
                    this.npmInstall([key + '@' + devDependencies[key]], { 'saveDev': true } );
                }
            }
            for (var key2 in dependencies) {
                console.log("installIntoExisting: pkg name: " + key2 + ";; version: " + dependencies[key2]);
                if (dependencies.hasOwnProperty(key2)){
                    this.npmInstall([key2 + '@' + dependencies[key2]], { 'save': true } );
                }
            }
        }
    });




    /**
     * Main constructor for public component of generator. Adds new methods
     * to 'Base' generator
     */
    var GulpWebpackEssentialsGenerator = PrivateBase.extend({

        /**
         * sets generator up
         */
        constructor: function constructor() {
            // Calling superconstructor is important to correctly set up our generator
            yeoman.generators.Base.apply(this, arguments);

            // adds support for `--coffee`, `--server`, '--webapp' flags (unused)
            ['coffee', 'server', 'webapp'].forEach(function(opt) {
                this.option(opt);
            }.bind(this));

        },


        /**
         * Run before prompting user
         */
        initializing: {
            getInquirer: function getInquirer() {
                this.inquirer = inquirer;
                // var ui = new this.inquirer.ui.BottomBar();
            },
            getmkdirp: function getmkdirp() {
                this.mkdir = mkdirp;
            },
        },



        /**
         * Get info from user (runs third...hopefully)
         */
        prompting: {

            promptForProjectType: function promptForProjectType() {
                var done = this.async();

                this.log(yosay(
                    'Welcome to the unit testing, Gulp, Webpack, and general-purpose essentials generator!'
                ));

                this.prompt({
                    type: 'list',
                    name: 'appType',
                    message: 'What type of project will this be?',
                    choices: ['minimal',
                        'add-to-existing',
                        new this.inquirer.Separator(),
                        'server',
                        'webapp',
                        new this.inquirer.Separator(),
                        'full stack: server + webapp',
                        new this.inquirer.Separator()
                    ],
                    default: 'minimal',
                    store: true,
                }, function(answers) {
                    this.appType = (_.camelCase(answers.appType.replace(' +', '')
                        .replace(':', '')));
                    console.log(this.appType);
                    done();
                }.bind(this));
            },

            /**
             * ask the user for the project type
             * @return {undefined} Continues with setup process after this function
             */
            promptForProjectName: function promptForProjectName() {
                var done = this.async();

                if (this.appType !== 'addToExisting'){
                    this.prompt({
                        type: 'input',
                        name: 'appName',
                        message: 'What is your project\'s name?',
                        store: true,
                        default: this.appName // Default to current folder name
                    }, function(answers) {
                        this.appName = answers.appName;
                        done();
                    }.bind(this));

                } else {
                    done();
                }
            },

            /**
             * ask the user for the project name
             * @return {undefined}
             */
            promptToInstallPkgs: function promptToInstallPkgs() {
                var done = this.async();

                this.prompt({
                    type: 'list',
                    name: 'doInstallPkgs',
                    message: 'Would you like me to auto-install your pkgs?',
                    choices: ['true', 'false'],
                    store: true,
                    default: true // Default to current folder name
                }, function(answers) {
                    this.doInstallPkgs = (answers.doInstallPkgs === 'true') ? true : false;
                    done();
                }.bind(this));
            },

        },


        /**
         * Test: ensure it's fourth priority.
         */
        configuring: {
            test3: function test3() {
                console.log('ran second, hopefully - 1');
            },
            test4: function test4() {
                console.log('ran second, hopefully  - 2');
            }
        },


        /**
         * Destination folders?
         */
        paths: function paths() {
            console.log(this.destinationRoot());
        },


        /**
         * create project folders
         * @returns {none}
         */
        scaffoldFolders: function scaffoldFolders() {
            if (this.appType !== "addToExisting") {
                var dirArr = ['view', 'lib', 'tasks', 'config', 'build', 'spec'];

                if (this.appType === 'server' || this.appType === 'fullStackServerWebapp') {
                    dirArr.concat(['server', 'server/routes', 'build/server']);
                }

                if (this.appType === 'webapp' || this.appType === 'fullStackServerWebapp') {
                    dirArr.concat(['view/styles', 'view/js', 'view/html', 'view/img',
                        'build/public', 'build/public/styles', 'build/public/scripts'
                    ]);
                }

                dirArr.forEach(function(curDir) {
                    this.mkdir(curDir);
                }.bind(this));
            }
        },


        /*
         * Make the basic root files
         */
        generateBasic: function generateBasic() {
            var templateData = { app_name: this.appName };
            console.log('templateData.app_name'); console.log(templateData.app_name);
            console.log('this.appName'); console.log(this.appName);
            console.log('this.appType'); console.log(this.appType);

            if (this.appType !== 'addToExisting') {
                this.copy('_nodemon.json', 'nodemon.json');
                this.template('_gitignore', '.gitignore');
                this.template('_package.json', 'package.json', templateData);
                this.template('_bower.json', 'bower.json', templateData);
                this.template('_gulpfile.js', 'gulpfile.js');
            }

        },


        /**
         * Installs all dependencies from npm and Bower
         * @type {Object}
         */
        install: {

            installDeps: function installDeps() {
                if (this.appType !== 'addToExisting') {
                    this.installAll.call(this);
                } else {
                    this.installIntoExisting.call(this);
                }
            }

        },


        end: function end() {
            console.log('Setup complete!');
        }
    });

    module.exports = GulpWebpackEssentialsGenerator;
    //   prompting: function () {
    //     var done = this.async();

    //     // Have Yeoman greet the user.
    //     this.log(yosay(
    //       'Welcome to the impeccable ' + chalk.red('GeneratorGulpWebpackFrontendEssentials') + ' generator!'
    //     ));

    //     var prompts = [{
    //       type: 'confirm',
    //       name: 'someOption',
    //       message: 'Would you like to enable this option?',
    //       default: true
    //     }];

    //     this.prompt(prompts, function (props) {
    //       this.props = props;
    //       // To access props later use this.props.someOption;

    //       done();
    //     }.bind(this));
    //   },

    //   writing: {
    //     app: function () {
    //       this.fs.copy(
    //         this.templatePath('_pkg.json'),
    //         this.destinationPath('pkg.json')
    //       );
    //       this.fs.copy(
    //         this.templatePath('_bower.json'),
    //         this.destinationPath('bower.json')
    //       );
    //     },

    //     projectfiles: function () {
    //       this.fs.copy(
    //         this.templatePath('editorconfig'),
    //         this.destinationPath('.editorconfig')
    //       );
    //       this.fs.copy(
    //         this.templatePath('jshintrc'),
    //         this.destinationPath('.jshintrc')
    //       );
    //     }
    //   },

    //   install: function () {
    //     this.installDependencies();
    //   }
    // });
    //
}());
