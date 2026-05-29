const { src, dest, task, series, watch } = require('gulp');
const gulpTypescript = require('gulp-typescript');
const typescript = require('typescript');

const tsProject = gulpTypescript.createProject('tsconfig.json', {
  typescript,
});

task('build', () => {
  return src(['nodes/**/*.ts', 'credentials/**/*.ts'])
    .pipe(tsProject)
    .pipe(dest('./dist'));
});

task('dev', () => {
  task('build')();
  watch(['nodes/**/*.ts', 'credentials/**/*.ts'], () => task('build')());
});

task('default', series('build'));
