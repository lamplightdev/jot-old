var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task("default", function () {

  var b = browserify({
    entries: './public/js/app.js',
    transform: []
  });

  b.ignore('pouchdb');
  b.ignore('pouchdb-find');
  b.ignore('cloudant');

  return b.bundle()
    .pipe(source("./app.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./public/js/dist"));
});
