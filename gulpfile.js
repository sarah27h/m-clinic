// any change in gulpfile need to restart

const { src, dest, watch, series, parallel } = require('gulp');

// compile Sass to CSS
const sass = require('gulp-sass');
// support CSS for old browsers
const autoprefixer = require('autoprefixer');
// minify CSS
const postcss = require('gulp-postcss');
// sync browsers each other and auto reload after code changes
const browserSync = require('browser-sync').create();
// minify JS
const uglify = require('gulp-uglify');
// support JS for old browsers
const babel = require('gulp-babel');

const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

// concate CSS, JS
const concat = require('gulp-concat');
// create source map files to CSS and JS
const sourcemaps = require('gulp-sourcemaps');
// rename files
const rename = require('gulp-rename');
const replace = require('gulp-replace');
// delete files and directories
const del = require('del');
// compress images
const imagemin = require('gulp-imagemin');
const imageminPngquant = require('imagemin-pngquant');
const fileExists = require('file-exists');

// define entry for browserify
const jsSrc = 'module.js';
const jsFolder = 'src/js/';
// we can add a script for front-end and scripts for back-end and so on
const jsFiles = [jsSrc];

const srcFiles = {
  mainScssPath: 'src/scss/**/mainStyle.scss',
  scssPagesPath: 'src/scss/pagesStyles/**/*.scss',
  scssPath: 'src/scss/**/*.scss',
  jsPath: 'src/js/**/*.js',
  jsFiles: 'src/js/',
  htmlPath: 'src/pages/**/*.html',
  imagesPath: 'src/images/**/*',
  indexPath: './index.html',
  webFontsPath: './node_modules/@fortawesome/fontawesome-free/webfonts/*',
  fontsPath: 'src/fonts/**',
};

const distFiles = {
  distPath: 'dist/',
  distPagesPath: 'dist/pages',
  distImagesPath: 'dist/images',
  distCSSPath: 'dist/css',
  distJSPath: 'dist/js',
  distWebfonts: 'dist/webfonts',
  distFontsPath: 'dist/fonts',
};

// note:
// use async in gulp tasks
// task might contain asynchronous code
// you have to signal gulp
// when your task has finished executing (= "async completion")

// flag to Gulp to run different tasks for prod, dev
const argv = require('yargs').argv;
// to check conditions
const gulpif = require('gulp-if');

// create production parameter to Gulp Task from command line
// run by using `gulp build --production`
const production = argv.production;

// check fontawesome webfonts exist then make a copy in dist
const fontawesomeWebfont =
  './node_modules/@fortawesome/fontawesome-free/webfonts/fa-brands-400.eot';

// to check if file exist or not for testing purposes
console.log(fileExists.sync(fontawesomeWebfont)); // OUTPUTS: true or false

async function copyfontawesomeWebfontsTask() {
  return gulpif(
    fileExists.sync(fontawesomeWebfont),
    src([srcFiles.webFontsPath]).pipe(dest(distFiles.distWebfonts))
  );
}

// copy fonts if exist
const localFonts = srcFiles.fonts;
async function copyFontsTask() {
  return gulpif(
    fileExists.sync(localFonts),
    src([srcFiles.fontsPath]).pipe(dest(distFiles.distFontsPath))
  );
}

// for cachebust
const cachebust = require('gulp-cache-bust');

function initIndexHtml() {
  return src([srcFiles.indexPath]).pipe(dest(distFiles.distPath));
}

function copyHTMLTask() {
  return src([srcFiles.htmlPath]).pipe(dest(distFiles.distPagesPath));
}

function copyImagesTask() {
  return src([srcFiles.imagesPath]).pipe(dest(distFiles.distImagesPath));
}

// Sass task: compiles the Scss files into CSS
function scssTask() {
  return (
    src([srcFiles.mainScssPath, srcFiles.scssPagesPath])
      .pipe(gulpif(!production, sourcemaps.init()))
      .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError)) // compile SCSS to CSS
      .pipe(postcss([autoprefixer()]))
      .pipe(gulpif(production, rename({ extname: '.min.css' })))
      .pipe(gulpif(!production, sourcemaps.write('./')))
      .pipe(dest(distFiles.distCSSPath)) // put final CSS in dist folder
      // stream changes to all browsers sync all browser
      // inject changes without refreshing the page
      // This command is useful because it keeps the scroll position intact
      .pipe(browserSync.stream())
  );
}

async function jsTask() {
  jsFiles.map(function (entry) {
    return (
      browserify({
        entries: [jsFolder + entry],
      })
        .transform(babelify, { presets: ['@babel/preset-env'] })
        .bundle()
        .pipe(source('all.js'))
        // To load existing source maps
        // This will cause sourceMaps to use the previous sourcemap to create an ultimate sourcemap
        .pipe(gulpif(production, rename({ extname: '.min.js' })))
        .pipe(buffer())
        .pipe(gulpif(!production, sourcemaps.init({ loadMaps: true })))
        // .pipe(concat('all.js'))
        .pipe(gulpif(production, uglify()))
        .pipe(gulpif(!production, sourcemaps.write('./')))
        .pipe(dest(distFiles.distJSPath))
    );
  });
}

// optimize images
function images() {
  return src([srcFiles.imagesPath])
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [imageminPngquant(), { removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest(distFiles.distImagesPath));
}

// delete dist files before running build
function cleanDistForBuild() {
  return del([distFiles.distPath, '!dist/images', '!dist/css', '!dist/js']);
}

// delete min files for development
function deleteMinFiles() {
  return del([`${distFiles.distCSSPath}/*.min.css`, `${distFiles.distJSPath}/*.min.js`]);
}

// dynamically change href and src in index.html in production
function templateTask() {
  return src([srcFiles.indexPath])
    .pipe(replace(/mainStyle.css/g, 'mainStyle.min.css'))
    .pipe(replace(/all.js/g, 'all.min.js'))
    .pipe(dest(distFiles.distPath));
}

// dynamically change href and src in web pages in production
function templatePagesTask() {
  return src([srcFiles.htmlPath])
    .pipe(replace(/mainStyle.css/g, 'mainStyle.min.css'))
    .pipe(replace(/all.js/g, 'all.min.js'))
    .pipe(dest(distFiles.distPagesPath));
}

// Cache busting solves the browser caching issue
// by using a unique file version identifier to
// tell the browser that a new version of the file is available.
// Therefore the browser doesn't retrieve the old file from cache but
// rather makes a request to the origin server for the new file
function cacheBustTask() {
  return src('index.html')
    .pipe(
      cachebust({
        type: 'timestamp',
      })
    )
    .pipe(dest('.')); // put in the same place
}

// start server
// using done
// Gulp needs this hint if you want to order a series of tasks that depend on each other
// series(parallel(scssTask, jsTask), serveTask, watchTask);
// watch task will not start until serveTask stoped
function serveTask() {
  // init browserSync
  browserSync.init({
    // setup server
    server: {
      baseDir: './dist/',
    },
  });

  // done();
}

function reload(done) {
  browserSync.reload();
  done();
}

// watch for changes
function watchTask() {
  // list srcFiles we need to watch
  // watch(files to watch, tasks to run when changes occurs)
  watch([srcFiles.scssPath, srcFiles.mainScssPath], series(scssTask, cacheBustTask));
  watch(srcFiles.jsPath, series(jsTask, cacheBustTask, reload));
  //watch changes in root index.html
  watch(srcFiles.indexPath, series(initIndexHtml, reload));
  // watch for changes in html pages
  watch(srcFiles.htmlPath, series(copyHTMLTask, reload));
  //watch changes for dist/index.html
  watch('./dist/index.html', reload);
  watch(srcFiles.imagesPath, series(copyImagesTask, reload));
  // when making a change in html, js we need browser to refresh
  // watch(srcFiles.jsPath).on('change', browserSync.reload);
  // watch(srcFiles.htmlPath).on('change', browserSync.reload);
}

// you should add your tasks to be run first time
// then any change in them will be managed by watchTask
exports.default = series(
  deleteMinFiles,
  parallel(
    scssTask,
    jsTask,
    initIndexHtml,
    copyHTMLTask,
    copyImagesTask,
    copyfontawesomeWebfontsTask,
    copyFontsTask
  ),
  cacheBustTask,
  parallel(serveTask, watchTask)
);

// to produce a production version
exports.build = series(
  cleanDistForBuild,
  parallel(
    scssTask,
    jsTask,
    images,
    templateTask,
    templatePagesTask,
    copyHTMLTask,
    copyImagesTask,
    copyfontawesomeWebfontsTask,
    copyFontsTask
  )
);
