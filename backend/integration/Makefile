
install:
	for version in v0*; do\
		(cd $$version;npm install);\
	done;

test:
	for source in attach-*; do\
		browserify -t babelify is-travis.js $$source > tmp.js;\
		echo "Built $$source";\
		cat tmp.js | tape-run;\
		echo "Ran $$source";\
	done;
	rm tmp.js
