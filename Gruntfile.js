module.exports = function (grunt) {
  var srcFiles = ['Gruntfile.js', 'lib/*.js', 'test/*.js', 'examples/*.js'];

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsbeautifier');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      options: {
        reporter: 'spec',
        require: ['should']
      },
      src: ['test/*.js']
    },
    jshint: {
      all: srcFiles
    },
    jsbeautifier: {
      options: {
        js: {
          indentSize: 2,
          jslintHappy: true
        }
      },
      files: srcFiles
    }
  });

  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('beautify', ['jsbeautifier']);
  grunt.registerTask('default', ['test', 'lint', 'beautify']);
};
