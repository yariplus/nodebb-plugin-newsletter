module.exports = (grunt) ->
  require('load-grunt-tasks') grunt
  grunt.loadNpmTasks 'grunt-istanbul'
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    babel:
      options:
        sourceMap: false
        presets: [ 'es2015' ]
      dist: files: [ {
        cwd: 'src'
        expand: true
        src: [ '**/*.es6' ]
        dest: './'
        ext: '.js'
      } ]
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
          quiet: false
          clearRequireCache: false
          require: 'babel-register'
        }
        src: ['test/*.js']
      }
    }
    instrument: {
      files: 'lib/**/*.js'
      options: {
        lazy: true
        basePath: 'test/coverage/instrument/'
      }
    }
    reloadTasks: {
      rootPath: 'test/coverage/instrument/lib/'
    }
    storeCoverage: {
      options: {
        dir: 'test/coverage/reports'
      }
    }
    makeReport: {
      src: 'test/coverage/reports/**/*.json'
      options: {
        type: 'lcov'
        dir: 'test/coverage/reports'
        print: 'detail'
      }
    }
  grunt.registerTask 'test', 'Run unit and formatting tests.', [ 'compile', 'mochaTest', 'instrument', 'reloadTasks', 'storeCoverage', 'makeReport' ]
  grunt.registerTask 'compile', 'Transpile ES6 sources to js.', [ 'babel' ]
  return
