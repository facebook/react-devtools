
install:
	for version in v0*; do\
		(cd $$version;npm install);\
	done;

test:
	browserify -t babelify is-travis.js attach-0.11.js|tape-run
	browserify -t babelify is-travis.js attach-0.12.js|tape-run
	browserify -t babelify is-travis.js attach-0.13.js|tape-run
	browserify -t babelify is-travis.js attach-0.14.js|tape-run

