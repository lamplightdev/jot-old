'use strict';

var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("babelify");
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sass = require('gulp-sass');
var nodemon = require("gulp-nodemon");

function compile(watch) {
  var bundler = watchify(browserify('./public/js/app.js', {
    debug: true
  }).transform(babel));

  bundler.ignore('pouchdb');
  bundler.ignore('pouchdb-find');
  bundler.ignore('cloudant');

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('app-dist.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./public/js/dist'));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  rebundle();
}

gulp.task('sass', function () {
  gulp.src('./public/sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./public/css'));
});

gulp.task('build', function () {
  return compile();
});

gulp.task('watchify', function () {
  return compile(true);
});

gulp.task('dev', ['watchify'], function () {
  nodemon({
    verbose: true,
    exec: 'babel-node-debug',
    script: 'server.js',
    ext: 'js scss',  //need to watch js for server side (watchify handles client)
    ignore: ["public/js/dist/", ".git", "node_modules", ".sass-cache"],
    env: { 'NODE_ENV': 'development' }
  })
    .on('start', ['sass']);
});
