var gulp = require('gulp');

var concat        = require('gulp-concat'),
    connect       = require('gulp-connect'),
    del           = require('del'),
    jshint        = require('gulp-jshint'),
    uglify        = require('gulp-uglify');

var config = {
    dest: "dist",
    html: {
        all: "src/**/*.html",
        options: {
            module: "app"
        }
    },
    scripts: {
        all: "src/**/*.js",
        main: "src/app.module.js",
        options: {
            mangle: false
        },
        out: "app.js"
    },
    server: {
        root: '',
        port: 1337
    },
    styles: {
        all: "src/**/*.scss",
        autoprefixerOptions: ['last 2 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
        main: "src/module.scss",
        sassOptions: {
            style: 'compressed'
        }
    }
};

gulp.task('clean', function() {
   del(config.dest + "/**/*");
});

gulp.task('connect', function () {
    connect.server(config.server);
});

gulp.task('lint', function() {
    gulp.src(config.scripts.all)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function() {
   gulp.src(config.scripts.all)
       .pipe(concat(config.scripts.out))
       .pipe(uglify())
       .pipe(gulp.dest(config.dest));
});

gulp.task('watch', function() {
    gulp.watch(config.scripts.all, ['scripts', 'lint']);
});


gulp.task('default', ['clean', 'lint', 'scripts', 'watch', 'connect']);