const gulp = require('gulp');
const del = require('del');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const sourcemaps = require('gulp-sourcemaps');
const ejs = require('gulp-ejs-monster');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const browserSync = require('browser-sync').create();

/**
 * Clean the output directory
 */

const clean = () => del(['build']);

/**
 * Compile EJS to HTML
 */

function markup() {
  return gulp
    .src('./src/*.ejs')
    .pipe(
      plumber({
        errorHandler: notify.onError((err) => ({
          title: 'Markup task failed',
          message: err.message,
        })),
      }),
    )
    .pipe(sourcemaps.init())
    .pipe(ejs())
    .pipe(gulp.dest('./build'));
}

/**
 * Compile Less to CSS
 * Prefix stylesheets with PostCSS
 */

function stylesDev() {
  return gulp
    .src('./src/styles/index.less')
    .pipe(
      plumber({
        errorHandler: notify.onError((err) => ({
          title: 'Styles dev task failed',
          message: err.message,
        })),
      }),
    )
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(postcss([autoprefixer()]))
    .pipe(rename('main.css'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./build/styles'));
}

/**
 * Compile Less to CSS
 * Remove unused styles
 * Prefix and minify stylesheets with PostCSS
 */

function stylesProd() {
  return gulp
    .src('./src/styles/index.less')
    .pipe(
      plumber({
        errorHandler: notify.onError((err) => ({
          title: 'Styles prod task failed',
          message: err.message,
        })),
      }),
    )
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(rename('main.css'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./build/styles'));
}

/**
 * Transpile and concatinate scripts
 */

function scriptsDev() {
  return gulp
    .src('./src/scripts/**/*.js')
    .pipe(
      plumber({
        errorHandler: notify.onError((err) => ({
          title: 'Scripts dev task failed',
          message: err.message,
        })),
      }),
    )
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ['@babel/env'] }))
    .pipe(concat('main.js'))
    .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest('./build/scripts'));
}

/**
 * Transpile, concatinate and minify scripts
 */

function scriptsProd() {
  return gulp
    .src('./src/scripts/**/*.js', { base: './' })
    .pipe(
      plumber({
        errorHandler: notify.onError((err) => ({
          title: 'Scripts prod task failed',
          message: err.message,
        })),
      }),
    )
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ['@babel/env'] }))
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest('./build/scripts'));
}

/**
 * Move assets to the build directory
 */

function assets() {
  return gulp
    .src('./src/assets/**/*', { since: gulp.lastRun(assets) })
    .pipe(gulp.dest('./build/assets'));
}

/**
 * Browsersync server
 */

function serve(done) {
  browserSync.init({
    open: false,
    notify: false,
    codeSync: false,
    ghostMode: false,
    server: { baseDir: './build' },
    watchOptions: { debounceDelay: 1000 },
  });
  done();
}

/**
 * Reload Browsersync server
 */

function reload(done) {
  browserSync.reload();
  done();
}

/**
 * Watch source files for changes
 */

function watch() {
  gulp.watch('./src/*.ejs', gulp.series(markup, reload));
  gulp.watch('./src/styles/**/*.{less,css}', gulp.series(stylesDev, reload));
  gulp.watch('./src/scripts/**/*.js', gulp.series(scriptsDev, reload));
  gulp.watch('./src/assets/**/*', gulp.series(assets, reload));
}

/**
 * Export Gulp tasks
 */

const start = gulp.series(
  clean,
  gulp.parallel(markup, stylesDev, scriptsDev, assets),
  serve,
  watch,
);

const build = gulp.series(
  clean,
  gulp.parallel(markup, stylesProd, scriptsProd, assets),
);

exports.start = start;
exports.build = build;
exports.clean = clean;

exports.default = start;
