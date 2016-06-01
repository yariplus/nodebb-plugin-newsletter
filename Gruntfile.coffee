module.exports = (grunt) ->
  require('load-grunt-tasks') grunt
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
        src: ['test/**/*.js']
      }
    }
  grunt.registerTask 'test', 'Run unit and formatting tests.', [ 'mochaTest' ]
  grunt.registerTask 'compile', 'Transpile ES6 sources to js.', [ 'babel' ]
  return
