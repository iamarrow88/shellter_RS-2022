const { src, dest, series, parallel, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const babel = require('gulp-babel');
const esbuild = require('gulp-esbuild');
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

const paths = {
    scss: {
        src: 'src/scss/**/*.scss',
        dest: 'dist/css/'
    },
    js: {
        src: 'src/js/**/*.js',
        dest: 'dist/js/'
    },
    html: 'src/*.html',
    images: 'src/assets/img/**/*.*'
};

const styles = () => {
    return src(paths.scss.src, { sourcemaps: isDev })
        .pipe(plumber({ errorHandler: notify.onError('SCSS Error: <%= error.message %>') }))
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: isDev ? 'expanded' : 'compressed' }).on('error', sass.logError))
        .pipe(postcss([
            autoprefixer({
                overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead']
            })
        ]))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(paths.scss.dest))
        .pipe(browserSync.stream());
};

const scripts = () => {
    return src('src/js/main.js', { sourcemaps: isDev })
        .pipe(plumber({ errorHandler: notify.onError('JS Error: <%= error.message %>') }))
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(esbuild({
            format: 'iife', // РґР»СЏ Р±СЂР°СѓР·РµСЂР° Р±РµР· РјРѕРґСѓР»РµР№
            target: 'es2015',
            minify: !isDev
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(paths.js.dest));
};

const html = () => src(['src/*.html', 'src/**/**.html']).pipe(dest('dist/'));

const images = () => {
    return src('src/assets/img/**/*')
        .pipe(dest('dist/assets/img/'));
};

//cleaning dist folder
const clean = (done) => {
    console.log('cleaning');
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
        console.log('🧹 dist/ удалена');
    } else {
        console.log('dist is not exist');
    }
    done();
};

// BrowserSync
const serve = () => {
    browserSync.init({
        server: {
            baseDir: 'dist/',
            index: 'index.html'
        },
        notify: false,
        open: false,
    });
};

// Watch
const watchFiles = () => {
    watch(paths.scss.src, styles);
    watch(paths.js.src, series(scripts, browserSync.reload));
    watch(paths.html, series(html, browserSync.reload));
    watch(paths.images, series(images, browserSync.reload)); // в†ђ РґРѕР±Р°РІРёР»Рё
};

exports.styles = styles;
exports.scripts = scripts;

exports.build = series(clean, parallel(styles, scripts, html, images)); // в†ђ РґРѕР±Р°РІРёР»Рё images
exports.dev = series(exports.build, parallel(watchFiles, serve));

exports.default = exports.dev;