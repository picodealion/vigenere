var gulp = require('gulp');

var browserify = require('gulp-browserify'),
    concat     = require('gulp-concat'),
    connect    = require('gulp-connect'),
    del        = require('del'),
    jshint     = require('gulp-jshint'),
    uglify     = require('gulp-uglify');

var config = {
    dest: "dist",
    scripts: {
        all: "src/**/*.js",
        main: "src/js/main.js",
        options: {
            mangle: false
        },
        out: "vigenere.js"
    },
    server: {
        root: '',
        port: 1337
    }
};

gulp.task('clean', function() {
   del(config.dest + "/**/*");
});

gulp.task('connect', function() {
    connect.server(config.server);
});

gulp.task('hint', function() {
    gulp.src(config.scripts.all)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function() {
   gulp.src(config.scripts.main)
       .pipe(browserify({
           debug: true
       }))
       .pipe(concat(config.scripts.out))
       .pipe(uglify())
       .pipe(gulp.dest(config.dest));
});

gulp.task('watch', function() {
    gulp.watch(config.scripts.all, ['hint', 'scripts']);
});


gulp.task('default', ['clean', 'hint', 'scripts', 'watch', 'connect']);