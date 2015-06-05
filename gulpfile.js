var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var pkg = require('./package.json');
var lrServer = require('tiny-lr')();

var BUILD_DEST = "build";

/* ---- Clean Up ---- */

// Clean up build directory depending on build types
gulp.task('clean', function(cb) {
  var del = require('del');
  del(BUILD_DEST, cb);
});

/* ---- Stylesheets ---- */

gulp.task('styles', function () {
  return gulp.src('./*.scss')
    // Only create sourcemaps for development
    .pipe(plugins.sourcemaps.init())
      .pipe(plugins.sass({ errLogToConsole: true }))
      .pipe(plugins.autoprefixer('last 2 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest(BUILD_DEST))
    // Only livereload for local development
    .pipe(plugins.livereload(lrServer));
});

/* ---- js tasks ---- */
gulp.task('lint', function () {
  return gulp.src('./*.js')
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'));
});

/* ---- Browserify Bundling ---- */
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var nghtml2js = require('browserify-ng-html2js');

// Compile angular app scripts
gulp.task('scripts', function () {
  var appBundle = browserify('./app.js', {
    // generate sourcemaps when not building for production
    debug: true,
  });
  // Transform template files
  appBundle.transform(nghtml2js({
    module: 'templates'
  }));
  // Bundle
  var stream = appBundle.bundle().pipe(source('app.js'))
    .pipe(gulp.dest(BUILD_DEST));
  stream.pipe(plugins.livereload(lrServer));
  return stream;
});

gulp.task('html', function () {
  return gulp.src('./*.html')
    .pipe(gulp.dest(BUILD_DEST))
    .pipe(plugins.livereload(lrServer));
});

/* ---- Serve + livereload ---- */
gulp.task('serve', function() {
  var opts = {
    root: BUILD_DEST,
    expressPort: 5000,
    lrPort: 35729
  };
  // Create express server
  var express = require('express');
  var app = express();
  app.use(require('connect-livereload')());
  plugins.livereload.listen({port: opts.lrPort});
  app.use(express.static(opts.root));
  app.listen(opts.expressPort);
});

/* ---- High-level tasks ---- */

// The build task first cleans, then builds the html templates, compresses images, compiles stylesheets, and compiles scripts
gulp.task('build', function (cb) {
  var runSequence = require('run-sequence');
  runSequence(
    'clean',
    'lint',
    ['scripts', 'styles', 'html'],
    cb);
});

// Watch the source for changes
gulp.task('watch', ['build'], function () {
  gulp.watch('./*.scss', ['styles']);
  gulp.watch('./*.js', ['lint', 'scripts']);
  gulp.watch('./*.html', ['html']);
});

// The default task is to watch for changes and serve the app with livereload
gulp.task('default', ['watch', 'serve']);