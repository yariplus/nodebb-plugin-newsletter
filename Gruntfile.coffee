module.exports = (grunt) ->
  require('load-grunt-tasks') grunt
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    babel:
      options:
        sourceMap: false
        presets: [ 'es2015' ]
      dist: files: [ {
        'cwd': 'src'
        'expand': true
        'src': [ '**/*.es6' ]
        'dest': './'
        'ext': '.js'
      } ]
  grunt.registerTask 'default', [ 'babel' ]
  return
