var gulp = require('gulp');

var concat        = require('gulp-concat'),
    connect       = require('gulp-connect'),
    del           = require('del'),
    jshint        = require('gulp-jshint'),
    uglify        = require('gulp-uglify');

var config = {
    dest: "dist",
    scripts: {
        all: "src/**/*.js",
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